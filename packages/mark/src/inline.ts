import { Inline } from "./types.ts";
import { locate, type ParserContext } from "./Context.ts";

export function try_link(ctx: ParserContext): Inline.Link | undefined {
	const revert = ctx.checkpoint();
	const from = ctx.index;

	if (!ctx.consume_if("[")) return undefined;

	const content = inline(ctx, "]", "[", "![") as Exclude<Inline, { type: "link" | "image" }>[];

	if (!ctx.consume_if("](")) return revert();

	let url = "";
	while (ctx.not(")", "\n")) {
		if (ctx.eof()) return revert();
		url += ctx.consume();
	}

	if (!ctx.consume_if(")")) return revert();

	return locate(ctx, from, new Inline.Link(content, url));
}

export function try_image(ctx: ParserContext): Inline.Image | undefined {
	const revert = ctx.checkpoint();
	const from = ctx.index;

	if (!ctx.consume_if("!")) return undefined;

	const link = try_link(ctx);
	if (link === undefined) return revert();

	return locate(ctx, from, new Inline.Image(link.content, link.url));
}

export function try_matching_inline(ctx: ParserContext, char: string): Inline[] | undefined {
	const revert = ctx.checkpoint();

	if (!ctx.consume_if(char)) return undefined;

	const content = inline(ctx, char, "\n");

	if (content.length === 0 || ctx.not(char)) return revert();

	ctx.consume(char); // consume the closing char

	return content;
}

export function try_strong(ctx: ParserContext): Inline.Strong | undefined {
	const from = ctx.index;
	const content = try_matching_inline(ctx, "*") as Exclude<Inline, Inline.Strong>[];
	if (content === undefined) return undefined;
	return locate(ctx, from, new Inline.Strong(content));
}

export function try_strike(ctx: ParserContext): Inline.Strike | undefined {
	const from = ctx.index;
	const content = try_matching_inline(ctx, "~~") as Exclude<Inline, Inline.Strike>[];
	if (content === undefined) return undefined;
	return locate(ctx, from, new Inline.Strike(content));
}

/** A letter or digit, in any script: what an underscore inside a word sits between. */
const WORD = /[\p{L}\p{N}]/u;

/** The character before the context's position, or "" at the start of its text. */
function previous(ctx: ParserContext): string {
	return ctx.index > 0 ? ctx.input[ctx.index - 1]! : "";
}

/** Adjacent text nodes joined into one, with a position spanning both. */
function merge_text(nodes: Inline[]): Inline[] {
	const merged: Inline[] = [];
	for (const node of nodes) {
		const last = merged.at(-1);
		if (node.type !== "text" || last?.type !== "text") {
			merged.push(node);
			continue;
		}
		const joined = new Inline.Text(last.content + node.content);
		if (last.position && node.position) joined.position = { start: last.position.start, end: node.position.end };
		merged[merged.length - 1] = joined;
	}
	return merged;
}

/**
 * Emphasis, `_like this_`, by GFM's rule for underscores: one opens only where it does
 * not follow a letter, digit or another underscore, and closes only where it is not
 * followed by one.
 *
 * So an underscore inside a word is text, as it is on GitHub: `set chat_id and
 * reply_markup` used to be italic from `id` to `reply`. And `__` is never a delimiter,
 * so `__x__` is text rather than emphasis between two stray underscores.
 */
export function try_emphasis(ctx: ParserContext): Inline.Emphasis | undefined {
	const revert = ctx.checkpoint();
	const from = ctx.index;

	const before = previous(ctx);
	const after = ctx.peek(1);
	if (ctx.not("_") || WORD.test(before) || before === "_" || after === "_" || /^\s?$/.test(after)) {
		return undefined;
	}
	ctx.consume();

	const content: Inline[] = [];
	while (true) {
		content.push(...inline(ctx, "_", "\n"));
		if (ctx.not("_")) return revert(); // the line ended first

		const closing_before = previous(ctx);
		const closing_after = ctx.peek(1);
		if (!/\s/.test(closing_before) && !WORD.test(closing_after) && closing_after !== "_") break;

		// Inside a word, `_like chat_id this_`, an underscore is text and the emphasis goes on.
		if (!WORD.test(closing_before) || !WORD.test(closing_after)) return revert();
		const at = ctx.index;
		ctx.consume();
		content.push(locate(ctx, at, new Inline.Text("_")));
	}

	if (content.length === 0) return revert();
	ctx.consume(); // the closing underscore

	const emphasis = new Inline.Emphasis(merge_text(content) as Exclude<Inline, Inline.Emphasis>[]);
	return locate(ctx, from, emphasis);
}

export function try_code(ctx: ParserContext): Inline.Code | undefined {
	const revert = ctx.checkpoint();
	const from = ctx.index;

	if (!ctx.consume_if("`")) return undefined;

	// Just capture raw text until the next backtick
	let content = "";
	while (ctx.not("`", "\n")) {
		if (ctx.eof()) return revert();
		content += ctx.consume();
	}

	if (ctx.not("`") || content.length === 0) return revert();

	ctx.consume(); // consume the closing backtick
	return locate(ctx, from, new Inline.Code(content));
}

export function try_variable_interpolation(
	ctx: ParserContext,
): Inline.VariableInterpolation | undefined {
	const revert = ctx.checkpoint();
	const from = ctx.index;

	if (!ctx.consume_if("${")) return undefined;

	// TODO: support expressions
	let name = "";
	while (ctx.not("}", "\n")) {
		if (ctx.eof()) return revert();
		name += ctx.consume();
	}

	if (ctx.not("}")) return revert();

	ctx.consume(); // consume the closing brace
	return locate(ctx, from, new Inline.VariableInterpolation(name));
}

export function try_footnote_reference(ctx: ParserContext): Inline.FootnoteReference | undefined {
	const revert = ctx.checkpoint();
	const from = ctx.index;

	if (!ctx.consume_if("[^")) return undefined;

	let reference = "";
	while (ctx.not("]", "\n")) {
		if (ctx.eof()) return revert();
		reference += ctx.consume();
	}

	if (ctx.not("]")) return revert();

	ctx.consume(); // consume the closing bracket

	return locate(ctx, from, new Inline.FootnoteReference(reference));
}

export function inline(ctx: ParserContext, ...untilChar: string[]): Inline[] {
	const content: Inline[] = [];
	let buffer = "";

	// Ignore whitespace at the start of the inline
	ctx.nomnom();

	// Where the text in `buffer` began.
	let text_from = ctx.index;

	const flush = (to: number) => {
		if (buffer.length > 0) content.push(locate(ctx, text_from, new Inline.Text(buffer), to));
		buffer = "";
	};

	while (ctx.not(...untilChar, "\n")) {
		if (ctx.eof()) break;

		const before = ctx.index;
		let chunk: Inline | undefined;

		// escape character
		if (ctx.consume_if("\\")) buffer += ctx.consume();
		else if (
			(chunk =
				try_strong(ctx) ??
				try_strike(ctx) ??
				try_emphasis(ctx) ??
				try_code(ctx) ??
				try_link(ctx) ??
				try_image(ctx) ??
				try_footnote_reference(ctx) ??
				try_variable_interpolation(ctx))
		) {
			flush(before);
			content.push(chunk);
			text_from = ctx.index;
		} else buffer += ctx.consume();
	}

	flush(ctx.index);

	// Ignore whitespace at the end of the inline
	const last = content.at(-1);
	if (last?.type === "text") {
		const trimmed = last.content.trimEnd();
		const removed = last.content.length - trimmed.length;
		last.content = trimmed;
		if (trimmed.length === 0) content.pop();
		else if (removed > 0 && last.position) {
			// Trailing whitespace is never written escaped, so it is as long in the source.
			const { line, column, offset } = last.position.end;
			last.position.end = { line, column: column - removed, offset: offset - removed };
		}
	}

	return content;
}
