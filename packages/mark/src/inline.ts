import { Inline } from "./types";
import type { ParserContext } from "./Context";

export function try_link(ctx: ParserContext): Inline.Link | undefined {
	const checkpoint = ctx.index;

	if (!ctx.consume_if("[")) return undefined;

	const content = inline(ctx, "]", "[", "![") as Exclude<Inline, { type: "link" | "image" }>[];

	if (!ctx.consume_if("](")) return ctx.revert(checkpoint);

	let href = "";
	while (ctx.not(")", "\n")) {
		if (ctx.eof()) return ctx.revert(checkpoint);
		href += ctx.consume();
	}

	if (!ctx.consume_if(")")) return ctx.revert(checkpoint);

	return new Inline.Link(content, href);
}

export function try_image(ctx: ParserContext): Inline.Image | undefined {
	const checkpoint = ctx.index;

	if (!ctx.consume_if("!")) return undefined;

	const link = try_link(ctx);
	if (link === undefined) return ctx.revert(checkpoint);

	return new Inline.Image(link.content, link.href);
}

export function try_matching_inline(ctx: ParserContext, char: string): Inline[] | undefined {
	const checkpoint = ctx.index;

	if (!ctx.consume_if(char)) return undefined;

	const content = inline(ctx, char, "\n");

	if (content.length === 0 || ctx.not(char)) return ctx.revert(checkpoint);

	ctx.consume(char); // consume the closing char

	return content;
}

export function try_strong(ctx: ParserContext): Inline.Strong | undefined {
	const content = try_matching_inline(ctx, "*") as Exclude<Inline, Inline.Strong>[];
	if (content === undefined) return undefined;
	return new Inline.Strong(content);
}

export function try_strike(ctx: ParserContext): Inline.Strike | undefined {
	const content = try_matching_inline(ctx, "~~") as Exclude<Inline, Inline.Strike>[];
	if (content === undefined) return undefined;
	return new Inline.Strike(content);
}

/** MUST be tried before try_emphasis */
export function try_underline(ctx: ParserContext): Inline.Underline | undefined {
	const content = try_matching_inline(ctx, "__") as Exclude<Inline, Inline.Underline>[];
	if (content === undefined) return undefined;
	return new Inline.Underline(content);
}

export function try_emphasis(ctx: ParserContext): Inline.Emphasis | undefined {
	const content = try_matching_inline(ctx, "_") as Exclude<Inline, Inline.Emphasis>[];
	if (content === undefined) return undefined;
	return new Inline.Emphasis(content);
}

export function try_code(ctx: ParserContext): Inline.Code | undefined {
	const checkpoint = ctx.index;

	if (!ctx.consume_if("`")) return undefined;

	// Just capture raw text until the next backtick
	let content = "";
	while (ctx.not("`", "\n")) {
		if (ctx.eof()) return ctx.revert(checkpoint);
		content += ctx.consume();
	}

	if (ctx.not("`") || content.length === 0) return ctx.revert(checkpoint);

	ctx.consume(); // consume the closing backtick
	return new Inline.Code(content);
}

export function try_variable_interpolation(
	ctx: ParserContext,
): Inline.VariableInterpolation | undefined {
	const checkpoint = ctx.index;

	if (!ctx.consume_if("${")) return undefined;

	// TODO: support expressions
	let name = "";
	while (ctx.not("}", "\n")) {
		if (ctx.eof()) return ctx.revert(checkpoint);
		name += ctx.consume();
	}

	if (ctx.not("}")) return ctx.revert(checkpoint);

	ctx.consume(); // consume the closing brace
	return new Inline.VariableInterpolation(name);
}

export function try_footnote_reference(ctx: ParserContext): Inline.FootnoteReference | undefined {
	const checkpoint = ctx.index;

	if (!ctx.consume_if("[^")) return undefined;

	let reference = "";
	while (ctx.not("]", "\n")) {
		if (ctx.eof()) return ctx.revert(checkpoint);
		reference += ctx.consume();
	}

	if (ctx.not("]")) return ctx.revert(checkpoint);

	ctx.consume(); // consume the closing bracket

	return new Inline.FootnoteReference(reference);
}

export function inline(ctx: ParserContext, ...untilChar: string[]): Inline[] {
	const content: Inline[] = [];
	let buffer = "";

	const add = (chunk: Inline) => {
		if (buffer.length > 0) content.push(new Inline.Text(buffer));
		buffer = "";
		content.push(chunk);
	};

	// Ignore whitespace at the start of the inline
	ctx.nomnom();

	while (ctx.not(...untilChar, "\n")) {
		if (ctx.eof()) break;

		let chunk: Inline | undefined;

		// escape character
		if (ctx.consume_if("\\")) buffer += ctx.consume();
		else if ((chunk = try_strong(ctx))) add(chunk);
		else if ((chunk = try_strike(ctx))) add(chunk);
		else if ((chunk = try_underline(ctx))) add(chunk);
		else if ((chunk = try_emphasis(ctx))) add(chunk);
		else if ((chunk = try_code(ctx))) add(chunk);
		else if ((chunk = try_link(ctx))) add(chunk);
		else if ((chunk = try_image(ctx))) add(chunk);
		else if ((chunk = try_footnote_reference(ctx))) add(chunk);
		else if ((chunk = try_variable_interpolation(ctx))) add(chunk);
		else buffer += ctx.consume();
	}

	if (buffer.length > 0) content.push(new Inline.Text(buffer));

	// Ignore whitespace at the end of the inline
	const last = content.at(-1);
	if (last?.type === "text") {
		last.content = last.content.trimEnd();
		if (last.content.length === 0) content.pop();
	}

	return content;
}
