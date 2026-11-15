import type { HypermarkDocument, Point, Position } from "./types.ts";
import { ParseError, get_line_neighbours, squiggly } from "./common.ts";
import { SourceMap } from "./source.ts";

export interface ParseOptions {
	tab_size?: number;
	filename?: string;
}

interface ContextOptions extends ParseOptions {
	/** Where the context's text sits in the file: given for a quote's or a list item's copy. */
	source?: SourceMap;
}

const capture_error_presentation = (ctx: ParserContext, error: string) => {
	const { line, column } = ctx.point();
	const file = ctx.filename ?? ":";
	let message = "\n\n\n";
	message += get_line_neighbours(ctx.source.file, line).join("\n");
	message += `\n${squiggly(column)}\n`;
	message += `\n${error}\n`;
	message += " ".repeat(8) + `at ${file}:${line}:${column}\n`;
	return message;
};

/**
 * Give `node` the position of the context's text from `from` to `to`, by default up to
 * where the context is now.
 *
 * Takes indices rather than points so a parser can note where it began at no cost, and
 * pay for the conversion only when it succeeds: inline parsers are tried at every
 * character and mostly fail.
 */
export function locate<T extends { position?: Position }>(
	ctx: ParserContext,
	from: number,
	node: T,
	to: number = ctx.index,
): T {
	node.position = { start: ctx.source.point(from), end: ctx.source.point(to) };
	return node;
}

export function is_newline(ctx: ParserContext) {
	return ctx.is("\n");
}

export function is_inline_whitespace(ctx: ParserContext) {
	return ctx.is(" ") || ctx.is("\t");
}

export function is_whitespace(ctx: ParserContext) {
	return is_inline_whitespace(ctx) || is_newline(ctx);
}

/** A character that can start a name. */
const IDENT_START = /^[A-Za-z_]$/;

/**
 * A character that can continue a name.
 *
 * Shared by `ident` and `consume_keyword`, so that what counts as a name and where a
 * keyword ends cannot disagree.
 */
const IDENT_CHAR = /^[A-Za-z0-9_-]$/;

/** A name: a call, a decorator, a parameter, an object key. */
export function ident(ctx: ParserContext): string | undefined {
	let buffer = "";
	if (ctx.is(IDENT_START)) buffer += ctx.consume();
	while (ctx.is(IDENT_CHAR)) buffer += ctx.consume();
	return buffer.length > 0 ? buffer : undefined;
}

export class ParserContext {
	index = 0;
	tab_size: number;
	filename?: string;
	/** Where this context's text sits in the file being parsed. */
	source: SourceMap;

	constructor(public input: string, public doc: HypermarkDocument, options?: ContextOptions) {
		this.tab_size = options?.tab_size ?? 4;
		this.filename = options?.filename;
		this.source = options?.source ?? SourceMap.of(input);
	}

	/** Where the context is now, in the file — not in a quote's or a list item's copy. */
	point(): Point {
		return this.source.point(this.index);
	}

	error(expected: string, found: string) {
		const { line, column, offset } = this.point();
		let message = `Expected "${expected}", found "${found.replace(/\n/g, "\\n")}"\n`;
		return new ParseError(offset, line, column, message, this.filename);
	}

	unexpected(found: string) {
		const { line, column, offset } = this.point();
		let message = `Unexpected "${found.replace(/\n/g, "\\n")}"\n`;
		const presentation = capture_error_presentation(this, message);
		return new ParseError(offset, line, column, presentation, this.filename);
	}

	peek(offset: number = 0, count: number = 1) {
		return this.input.slice(this.index + offset, this.index + offset + count);
	}

	checkpoint() {
		const i = this.index;

		return (): undefined => {
			this.index = i;
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
		this.index += n;
		return slice;
	}

	consume_if(str: string): string | undefined {
		if (this.is(str)) return this.consume(str.length);
		return undefined;
	}

	/**
	 * `consume_if` for a word that must stand alone.
	 *
	 * `consume_if("null")` reads `null` off the front of `nullable`, which made
	 * `=f(nullable: true)` a single unnamed `null` followed by garbage — and the whole
	 * call fell back to a paragraph, printed as text.
	 */
	consume_keyword(word: string): string | undefined {
		if (this.not(word) || IDENT_CHAR.test(this.peek(word.length))) return undefined;
		return this.consume(word.length);
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
