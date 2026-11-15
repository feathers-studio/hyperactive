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

/** `*strong*`. As on GitHub, an asterisk may sit inside a word: `foo*bar*baz`. */
export function try_strong(ctx: ParserContext): Inline.Strong | undefined {
	const from = ctx.index;
	const content = try_delimited(ctx, "*", true) as Exclude<Inline, Inline.Strong>[] | undefined;
	return content && locate(ctx, from, new Inline.Strong(content));
}

/** `~strike~`, with one tilde: `~~struck~~` reads as text, as `**bold**` does. */
export function try_strike(ctx: ParserContext): Inline.Strike | undefined {
	const from = ctx.index;
	const content = try_delimited(ctx, "~", true) as Exclude<Inline, Inline.Strike>[] | undefined;
	return content && locate(ctx, from, new Inline.Strike(content));
}

/** `_emphasis_`. An underscore inside a word, as in `chat_id`, is text. */
export function try_emphasis(ctx: ParserContext): Inline.Emphasis | undefined {
	const from = ctx.index;
	const content = try_delimited(ctx, "_", false) as Exclude<Inline, Inline.Emphasis>[] | undefined;
	return content && locate(ctx, from, new Inline.Emphasis(content));
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
 * The content between two of `marker`: strong, emphasis and strike share these rules,
 * which are GFM's.
 *
 * - A marker is one character, never part of a run of it. So Markdown's `**bold**`,
 *   `__bold__` and `~~struck~~` read as text, visibly not what was meant, where GitHub
 *   formats them; before, runs made one formatted word between stray markers.
 * - It opens only before text and closes only after it, so `2 * 3 * 4` is arithmetic.
 * - Unless `inside_words`, a marker after a letter or digit does not open and one before
 *   a letter or digit does not close, so `chat_id` is text. One between two letters
 *   inside the run is text too, and the run carries on past it.
 */
function try_delimited(ctx: ParserContext, marker: string, inside_words: boolean): Inline[] | undefined {
	const revert = ctx.checkpoint();

	const before = previous(ctx);
	const after = ctx.peek(1);
	if (ctx.not(marker) || before === marker || after === marker || /^\s?$/.test(after)) return undefined;
	if (!inside_words && WORD.test(before)) return undefined;
	ctx.consume();

	const content: Inline[] = [];
	while (true) {
		content.push(...inline(ctx, marker, "\n"));
		if (ctx.not(marker)) return revert(); // the line ended first

		const closing_before = previous(ctx);
		const closing_after = ctx.peek(1);
		const closes =
			!/\s/.test(closing_before) &&
			closing_after !== marker &&
			(inside_words || !WORD.test(closing_after));
		if (closes) break;

		// `_like chat_id this_`: a marker that may not sit inside a word is text there.
		if (inside_words || !WORD.test(closing_before) || !WORD.test(closing_after)) return revert();
		const at = ctx.index;
		ctx.consume();
		content.push(locate(ctx, at, new Inline.Text(marker)));
	}

	if (content.length === 0) return revert();
	ctx.consume(); // the closing marker
	return merge_text(content);
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
