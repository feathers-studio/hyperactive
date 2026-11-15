import type { Point } from "./types.ts";

/**
 * Turns offsets in a context's text into points in the file being parsed.
 *
 * Quotes and list items are parsed again from a copy with their `> ` or indentation
 * stripped, so an offset in that copy is not an offset in the file. Each line of the
 * copy is still one unbroken piece of one line of the file, so knowing where each
 * copied line came from is enough to map any offset back, at any depth of nesting.
 */
export class SourceMap {
	/** Where each line of the file starts. */
	readonly #file_lines: number[];
	/** Where each line of this text starts, in this text. */
	readonly #lines: number[];
	/** Where each line of this text starts, in the file. */
	readonly #origins: number[];

	private constructor(
		/** The whole file, as given to `parse`. */
		readonly file: string,
		file_lines: number[],
		lines: number[],
		origins: number[],
	) {
		this.#file_lines = file_lines;
		this.#lines = lines;
		this.#origins = origins;
	}

	/** The map for a whole file, where every offset is its own. */
	static of(file: string): SourceMap {
		const lines = line_starts(file);
		return new SourceMap(file, lines, lines, lines);
	}

	/**
	 * The map for a copy built from pieces of this text: `starts[i]` is the offset in
	 * this text that line `i` of the copy was taken from.
	 */
	derive(copy: string, starts: number[]): SourceMap {
		const lines = line_starts(copy);
		const origins = starts.map(offset => this.file_offset(offset));
		// A line the caller did not place — the empty one after a final newline — is taken
		// to follow on from the line before it.
		for (let i = origins.length; i < lines.length; i++) {
			origins.push(origins[i - 1]! + (lines[i]! - lines[i - 1]!));
		}
		return new SourceMap(this.file, this.#file_lines, lines, origins);
	}

	file_offset(offset: number): number {
		// The whole file maps to itself, and is where most nodes are.
		if (this.#lines === this.#origins) return offset;
		const line = last_not_after(this.#lines, offset);
		return this.#origins[line]! + (offset - this.#lines[line]!);
	}

	point(offset: number): Point {
		const file_offset = this.file_offset(offset);
		const line = last_not_after(this.#file_lines, file_offset);
		return { line: line + 1, column: file_offset - this.#file_lines[line]! + 1, offset: file_offset };
	}
}

function line_starts(text: string): number[] {
	const starts = [0];
	for (let i = text.indexOf("\n"); i !== -1; i = text.indexOf("\n", i + 1)) starts.push(i + 1);
	return starts;
}

/** The index of the last entry not greater than `value`, in an ascending list starting at 0. */
function last_not_after(sorted: number[], value: number): number {
	let low = 0;
	let high = sorted.length - 1;
	while (low < high) {
		const middle = (low + high + 1) >> 1;
		if (sorted[middle]! <= value) low = middle;
		else high = middle - 1;
	}
	return low;
}
