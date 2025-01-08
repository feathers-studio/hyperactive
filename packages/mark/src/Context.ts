import type { HypermarkDocument } from "./types.ts";
import { ParseError, count_char, get_line_neighbours, squiggly } from "./common.ts";

export interface ParseOptions {
	tab_size?: number;
	filename?: string;
}

const capture_error_presentation = (ctx: ParserContext, error: string) => {
	const file = ctx.filename ?? ":";
	let message = "\n\n\n";
	message += get_line_neighbours(ctx.input, ctx.line).join("\n");
	message += `\n${squiggly(ctx.column)}\n`;
	message += `\n${error}\n`;
	message += " ".repeat(8) + `at ${file}:${ctx.line}:${ctx.column}\n`;
	return message;
};

export function is_newline(ctx: ParserContext) {
	return ctx.is("\n");
}

export function is_inline_whitespace(ctx: ParserContext) {
	return ctx.is(" ") || ctx.is("\t");
}

export function is_whitespace(ctx: ParserContext) {
	return is_inline_whitespace(ctx) || is_newline(ctx);
}

export class ParserContext {
	index: number;
	line: number;
	column: number;
	tab_size: number;
	filename?: string;

	constructor(public input: string, public doc: HypermarkDocument, options?: ParseOptions) {
		this.index = 0;
		this.line = 1;
		this.column = 1;
		this.tab_size = options?.tab_size ?? 4;
		this.filename = options?.filename;
	}

	error(expected: string, found: string) {
		let message = `Expected "${expected}", found "${found.replace(/\n/g, "\\n")}"\n`;
		return new ParseError(this.index, this.line, this.column, message, this.filename);
	}

	unexpected(found: string) {
		let message = `Unexpected "${found.replace(/\n/g, "\\n")}"\n`;
		const presentation = capture_error_presentation(this, message);
		return new ParseError(this.index, this.line, this.column, presentation, this.filename);
	}

	peek(offset: number = 0, count: number = 1) {
		return this.input.slice(this.index + offset, this.index + offset + count);
	}

	checkpoint() {
		const i = this.index;
		const l = this.line;
		const c = this.column;

		return (): undefined => {
			this.index = i;
			this.line = l;
			this.column = c;
			return undefined;
		};
	}

	eof() {
		return this.index >= this.input.length;
	}

	is(...str: (string | RegExp)[]) {
		return str.some(s => {
			if (typeof s === "string") return this.peek(0, s.length) === s;
			return s.test(this.peek());
		});
	}

	not(...str: (string | RegExp)[]) {
		return !this.is(...str);
	}

	consume(n: number | string = 1) {
		if (typeof n === "string") {
			if (this.not(n)) throw this.error(n, this.peek() ?? "EOF");
			n = n.length;
		}

		const slice = this.input.slice(this.index, this.index + n);
		const count = count_char(this.input, "\n", this.index, this.index + n);
		this.index += n;

		if (count.count > 0) {
			// If we found newlines, update line and reset column
			this.line += count.count;
			// Column should be the number of characters after the last newline + 1
			this.column = count.last_index === -1 ? 1 : n - count.last_index;
		} else {
			// If no newlines, just increment the column
			this.column += n;
		}

		return slice;
	}

	consume_if(str: string): string | undefined {
		if (this.is(str)) return this.consume(str.length);
		return undefined;
	}

	expect(str: string) {
		if (this.not(str)) throw this.error(str, this.peek());
		this.consume(str.length);
	}

	nomnom() {
		while (is_inline_whitespace(this)) this.consume();
	}

	nomnomnom() {
		while (is_whitespace(this)) this.consume();
	}
}
