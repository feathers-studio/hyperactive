// Adapted from https://deno.land/std@0.125.0
// Copyright 2018-2022 the Deno authors & Feathers Studio.
// All rights reserved. MIT license.

/** Make an assertion, if not `true`, then throw. */
export function assert(expr: unknown, msg = ""): asserts expr {
	if (!expr) {
		throw new Error(msg);
	}
}

// MIN_READ is the minimum ArrayBuffer size passed to a read call by
// buffer.ReadFrom.
const MAX_SIZE = 2 ** 32 - 2;

/**
 * Copy bytes from one Uint8Array to another.  Bytes from `src` which don't fit
 * into `dst` will not be copied.
 *
 * @param src Source byte array
 * @param dst Destination byte array
 * @param off Offset into `dst` at which to begin writing values from `src`.
 * @return number of bytes copied
 */
export function copy(src: Uint8Array, dst: Uint8Array, off = 0): number {
	off = Math.max(0, Math.min(off, dst.byteLength));
	const dstBytesAvailable = dst.byteLength - off;
	if (src.byteLength > dstBytesAvailable) {
		src = src.subarray(0, dstBytesAvailable);
	}
	dst.set(src, off);
	return src.byteLength;
}

export class PassThrough implements Deno.Reader, Deno.Writer, Deno.Closer {
	#buf: Uint8Array; // contents are the bytes buf[off : len(buf)]
	#off = 0; // read at buf[off], write at buf[buf.byteLength]
	#closed = false;

	constructor(ab?: ArrayBufferLike | ArrayLike<number>) {
		this.#buf = ab === undefined ? new Uint8Array(0) : new Uint8Array(ab);
	}

	/** Returns a slice holding the unread portion of the buffer.
	 *
	 * The slice is valid for use only until the next buffer modification (that
	 * is, only until the next call to a method like `read()`, `write()`,
	 * `reset()`, or `truncate()`). If `options.copy` is false the slice aliases the buffer content at
	 * least until the next buffer modification, so immediate changes to the
	 * slice will affect the result of future reads.
	 * @param options Defaults to `{ copy: true }`
	 */
	bytes(options = { copy: true }): Uint8Array {
		if (options.copy === false) return this.#buf.subarray(this.#off);
		return this.#buf.slice(this.#off);
	}

	/** Returns whether the unread portion of the buffer is empty. */
	empty(): boolean {
		return this.#buf.byteLength <= this.#off;
	}

	/** A read only number of bytes of the unread portion of the buffer. */
	get length(): number {
		return this.#buf.byteLength - this.#off;
	}

	/** The read only capacity of the buffer's underlying byte slice, that is,
	 * the total space allocated for the buffer's data. */
	get capacity(): number {
		return this.#buf.buffer.byteLength;
	}

	/** Discards all but the first `n` unread bytes from the buffer but
	 * continues to use the same allocated storage. It throws if `n` is
	 * negative or greater than the length of the buffer. */
	truncate(n: number): void {
		if (n === 0) {
			this.reset();
			return;
		}
		if (n < 0 || n > this.length) {
			throw Error("bytes.Buffer: truncation out of range");
		}
		this.#reslice(this.#off + n);
	}

	reset(): void {
		this.#reslice(0);
		this.#off = 0;
	}

	#tryGrowByReslice(n: number) {
		const l = this.#buf.byteLength;
		if (n <= this.capacity - l) {
			this.#reslice(l + n);
			return l;
		}
		return -1;
	}

	#reslice(len: number) {
		assert(len <= this.#buf.buffer.byteLength);
		this.#buf = new Uint8Array(this.#buf.buffer, 0, len);
	}

	/** Reads the next `p.length` bytes from the buffer or until the buffer is
	 * drained. Returns the number of bytes read. If the buffer has no data to
	 * return, the return is EOF (`null`). */
	readSync(p: Uint8Array): number | null {
		if (this.empty()) {
			// Buffer is empty, reset to recover space.
			this.reset();
			if (!this.#closed) return 0;
			// this edge case is tested in 'bufferReadEmptyAtEOF' test
			if (p.byteLength === 0) return 0;
			return null;
		}
		const nread = copy(this.#buf.subarray(this.#off), p);
		this.#off += nread;
		return nread;
	}

	/** Reads the next `p.length` bytes from the buffer or until the buffer is
	 * drained. Resolves to the number of bytes read. If the buffer has no
	 * data to return, resolves to EOF (`null`).
	 *
	 * NOTE: This methods reads bytes synchronously; it's provided for
	 * compatibility with `Reader` interfaces.
	 */
	read(p: Uint8Array): Promise<number | null> {
		const rr = this.readSync(p);
		return Promise.resolve(rr);
	}

	writeSync(p: Uint8Array): number {
		if (this.#closed) throw new Error("write called after close");
		const m = this.#grow(p.byteLength);
		return copy(p, this.#buf, m);
	}

	/** NOTE: This methods writes bytes synchronously; it's provided for
	 * compatibility with `Writer` interface. */
	write(p: Uint8Array): Promise<number> {
		const n = this.writeSync(p);
		return Promise.resolve(n);
	}

	#grow(n: number) {
		const m = this.length;
		// If buffer is empty, reset to recover space.
		if (m === 0 && this.#off !== 0) {
			this.reset();
		}
		// Fast: Try to grow by means of a reslice.
		const i = this.#tryGrowByReslice(n);
		if (i >= 0) {
			return i;
		}
		const c = this.capacity;
		if (n <= Math.floor(c / 2) - m) {
			// We can slide things down instead of allocating a new
			// ArrayBuffer. We only need m+n <= c to slide, but
			// we instead let capacity get twice as large so we
			// don't spend all our time copying.
			copy(this.#buf.subarray(this.#off), this.#buf);
		} else if (c + n > MAX_SIZE) {
			throw new Error("The buffer cannot be grown beyond the maximum size.");
		} else {
			// Not enough space anywhere, we need to allocate.
			const buf = new Uint8Array(Math.min(2 * c + n, MAX_SIZE));
			copy(this.#buf.subarray(this.#off), buf);
			this.#buf = buf;
		}
		// Restore this.#off and len(this.#buf).
		this.#off = 0;
		this.#reslice(Math.min(m + n, MAX_SIZE));
		return m;
	}

	/** Grows the buffer's capacity, if necessary, to guarantee space for
	 * another `n` bytes. After `.grow(n)`, at least `n` bytes can be written to
	 * the buffer without another allocation. If `n` is negative, `.grow()` will
	 * throw. If the buffer can't grow it will throw an error.
	 *
	 * Based on Go Lang's
	 * [Buffer.Grow](https://golang.org/pkg/bytes/#Buffer.Grow). */
	grow(n: number): void {
		if (n < 0) throw Error("Buffer.grow: negative count");
		const m = this.#grow(n);
		this.#reslice(m);
	}

	close() {
		this.#closed = true;
	}
}
