import { DecoratorEndMarker, DecoratorStartMarker } from "./common.ts";
import { is_newline, is_whitespace, ParserContext } from "./Context.ts";
import { Block, HypermarkDocument, Inline, Meta } from "./types.ts";
import { ident, try_param_value } from "./value.ts";
import { inline } from "./inline.ts";

export function param(ctx: ParserContext): Block.Parameter | undefined {
	const name = ident(ctx);
	if (!name) return undefined;

	ctx.nomnomnom();
	ctx.expect(":");
	ctx.nomnomnom();

	const value = try_param_value(ctx);
	if (value === undefined) throw ctx.error("value", ctx.peek());

	return new Block.Parameter(name, value);
}

export function callNotation(
	ctx: ParserContext,
	type: "@" | "=",
): Block.Call | Block.Decorator | Meta {
	ctx.nomnom();

	const name = ident(ctx);
	if (!name) throw ctx.error("identifier", ctx.peek());
	ctx.nomnom();

	const has_params = ctx.consume_if("(");
	const params = new Block.Parameters([]);

	if (has_params) {
		// try to parse a single value
		const value = try_param_value(ctx);
		if (value !== undefined) {
			const param = new Block.Parameter("__default", value);
			params.parameters.push(param);
		} else {
			// parse multiple named parameters
			let first = true;

			while (ctx.not(")")) {
				ctx.nomnomnom();

				if (ctx.eof()) throw ctx.error(")", "EOF");

				// expect a comma if not the first value
				// trailing commas are required at the moment
				// even empty objects are required to have a comma
				// TODO: fix this
				if (!first) ctx.expect(",");
				ctx.nomnomnom();

				const parameter = param(ctx);
				if (parameter === undefined) break;
				params.parameters.push(parameter);

				first = false;
			}
		}

		if (ctx.not(")")) throw ctx.error(")", ctx.peek());
		ctx.consume(); // consume the closing parenthesis
	}

	if (type === "@") return new Block.Decorator(name, params, []);
	else if (name === "meta") return new Meta(params);
	else return new Block.Call(name, params);
}

// TODO: =import() calls within codeblocks?
export function codeblock(ctx: ParserContext) {
	ctx.consume("```");

	let language = "";
	while (!is_whitespace(ctx)) language += ctx.consume();
	ctx.nomnom();

	let params = "";
	while (!is_newline(ctx)) params += ctx.consume();
	ctx.consume(); // consume the newline

	const code_params: Block.CodeBlockOptions = { language };

	for (const param of params.split(/\s+/)) {
		if (param.startsWith(":")) {
			const [key, value] = param.slice(1).split("=");
			if (key === "line-numbers") code_params.lineNumbers = true;
			else if (key === "highlight")
				code_params.highlight = value
					.split(",")
					.map(range => {
						const [start, end] = range
							.split("-")
							.map(Number)
							.map(n => (Number.isNaN(n) ? undefined : n));
						if (start === undefined) return undefined;
						return { start, end: end ?? start };
					})
					.filter((x): x is NonNullable<typeof x> => x !== undefined);
			else if (key === "end") code_params.end = value;
		} else if (!code_params.title) code_params.title = param;
		else throw ctx.error("valid codeblock parameter", param);
	}

	let content = "";
	const end_string = "\n```" + (code_params.end ?? "");

	// loop as along as we don't find the end of the codeblock
	// the end is automatically consumed by consume_if
	while (!ctx.consume_if(end_string)) {
		if (ctx.eof()) throw ctx.error("end of codeblock", "EOF");
		content += ctx.consume();
	}

	ctx.nomnom(); // slurp leftover whitespace after end_string

	return new Block.CodeBlock(content, code_params);
}

export function heading(ctx: ParserContext) {
	let level = 0;
	while (ctx.consume_if("#")) level++;
	if (level < 1 || level > 6) throw ctx.error("heading level 1-6", ctx.peek());
	const content = inline(ctx, "\n");
	return new Block.Heading(level as Block.HeadingLevel, content);
}

// paragraph parser, typically ends when two newlines are encountered
// or when a decorator, list, call, or code block is encountered
export function para(ctx: ParserContext) {
	let inline_list: Inline[] = [];

	while (!ctx.eof()) {
		// Check for block-level elements in next line
		if (ctx.is("\n")) {
			const next = ctx.peek(1);

			if (
				next === "#" ||
				next === "`" ||
				next === ">" ||
				next === "|" ||
				next === "-" ||
				next === "=" ||
				next === "@" ||
				next === "[" ||
				/[0-9+\.]/.test(next)
			) {
				break;
			}

			// Double newline still breaks
			if (next === "\n") break;

			// Add single newline as text and continue
			inline_list.push(new Inline.Text("\n"));
			ctx.consume();
			continue;
		}

		const chunk = inline(ctx, "\n");
		inline_list.push(...chunk);
	}

	return new Block.Paragraph(inline_list);
}

export function footnote(ctx: ParserContext) {
	let checkpoint = ctx.index;

	let reference = "";
	while (ctx.not("]", "\n")) {
		if (ctx.eof()) return ctx.revert(checkpoint);
		reference += ctx.consume();
	}

	if (ctx.not("]")) return ctx.revert(checkpoint);
	ctx.consume(); // consume the closing bracket

	if (!ctx.consume_if(":")) return ctx.revert(checkpoint);

	ctx.nomnom();

	const content = inline(ctx, "\n");

	const footnote = new Block.Footnote(reference, content);
	ctx.doc.footnote_collection[reference] = footnote;
	return footnote;
}

export function comment(ctx: ParserContext) {
	ctx.nomnom();

	let buffer = "";
	while (ctx.not("\n")) {
		if (ctx.eof()) break;
		buffer += ctx.consume();
	}

	return new Block.Comment(buffer);
}

export function quote(ctx: ParserContext): Block.Quote | undefined {
	let buffer = "";

	outer: while (ctx.consume_if(">")) {
		ctx.nomnom();
		while (ctx.not("\n")) {
			if (ctx.eof()) break outer;
			buffer += ctx.consume();
		}
		buffer += ctx.consume(); // include the newline
	}

	const doc2 = new HypermarkDocument();
	const opts = { tab_size: ctx.tab_size, filename: ":quote:" };
	const ctx2 = new ParserContext(buffer, doc2, opts);
	const reparse = parse_blocks(ctx2, false);

	return new Block.Quote(reparse);
}

export function try_alignment(ctx: ParserContext): Block.TableAlignment | undefined {
	const checkpoint = ctx.index;

	let buffer = "";
	while (ctx.is(":", "-")) buffer += ctx.consume();

	if (buffer.length === 0) return ctx.revert(checkpoint);

	if (/^:?-+$/.test(buffer)) return "left";
	if (/^-+:$/.test(buffer)) return "right";
	if (/^:-+:$/.test(buffer)) return "center";

	return ctx.revert(checkpoint);
}

export function table(ctx: ParserContext): Block.Table | undefined {
	const checkpoint = ctx.index;

	let header: Block.TableRow | undefined = undefined;
	const rows: Block.TableRow[] = [];
	let alignment: Block.TableAlignmentRow | undefined = undefined;

	// row starts with |
	while (ctx.is("|")) {
		let row = new Block.TableRow([]);
		let is_alignment_row = false;

		// cell starts with |
		while (ctx.consume_if("|")) {
			ctx.nomnom();
			if (ctx.is("\n") || ctx.eof()) break;

			const align = try_alignment(ctx);

			// first cell in this row is an alignment cell
			// AND this is the second row (rows already has 1 row)
			if (align && (rows.length === 1 || (rows.length === 0 && header))) {
				// pop the first row and use it as the header
				if (!header) header = new Block.TableRow(rows.pop()!.cells);

				if (!alignment) alignment = new Block.TableAlignmentRow([]);
				alignment.alignment.push(align);

				ctx.nomnom();

				is_alignment_row = true;
			} else {
				if (is_alignment_row) {
					// You started an alignment row,
					// but a subsequent cell doesn't have alignment
					// reparse previous cells as normal inline text
					is_alignment_row = false;

					row.cells = row.cells.map(cell => {
						return new Block.TableCell(cell.content.map(c => new Inline.Text(c.toString())));
					});
				}

				const content = inline(ctx, "|");
				if (ctx.not("|")) return ctx.revert(checkpoint);

				row.cells.push(new Block.TableCell(content));
			}
		}

		if (!is_alignment_row) rows.push(row);
		ctx.consume_if("\n");
	}

	let len = Math.max(...rows.map(row => row.cells.length));

	for (const row of rows) {
		while (row.cells.length < len) row.cells.push(new Block.TableCell([]));
	}

	if (alignment && alignment.alignment.length !== len) {
		const align = alignment.alignment;
		const aLen = align.length;
		if (aLen < len) align.push(...Array(len - aLen).fill("left"));
		else align.splice(len);
	}

	return new Block.Table(rows, header, alignment);
}

export function get_indent(ctx: ParserContext, from_offset: number): number {
	let indent = 0;
	let index = from_offset;

	while (ctx.peek(index) === " " || ctx.peek(index) === "\t") {
		indent += ctx.peek(index) === " " ? 1 : ctx.tab_size;
		index++;
	}

	return indent;
}

export function trim_indent(ctx: ParserContext, line: string, indent: number): string {
	let index = 0;
	let indent_level = 0;

	while (indent_level < indent) {
		if (line[index] === " " || line[index] === "\t") {
			indent_level += line[index] === " " ? 1 : ctx.tab_size;
			index++;
		} else break;
	}

	return line.slice(index);
}

export function list_item(ctx: ParserContext, indent_level: number): Block.ListItem | undefined {
	if (!ctx.consume_if("- ")) return undefined;

	indent_level += 2; // for the marker
	indent_level += get_indent(ctx, ctx.index); // whitespace before content adds to current indent level

	let content = "";

	while (!ctx.eof()) {
		if (ctx.is("\n") && ctx.peek(1) !== "\n") {
			// if the next line is indented less than the current indent level, break
			if (get_indent(ctx, 1) < indent_level) break;
			content += ctx.consume();
		}
		content += ctx.consume();
	}

	const normalised_content = content
		.split("\n")
		.map(line => trim_indent(ctx, line, indent_level))
		.join("\n");

	const doc2 = new HypermarkDocument();
	const opts = { tab_size: ctx.tab_size, filename: ":list:" };
	const ctx2 = new ParserContext(normalised_content, doc2, opts);
	const blocks = parse_blocks(ctx2, false);

	return new Block.ListItem(blocks);
}

export function list(ctx: ParserContext): Block.List {
	const items: Block.ListItem[] = [];

	let item: Block.ListItem | undefined;

	while ((item = list_item(ctx, 0))) {
		items.push(item);
	}

	return new Block.List(items);
}

export function parse_block(
	ctx: ParserContext,
	is_top_level: boolean,
): (Block | DecoratorEndMarker | DecoratorStartMarker)[] | undefined {
	if (ctx.eof()) return undefined;

	const char = ctx.peek();

	switch (char) {
		case "\n":
			ctx.consume();
			return undefined;
		case "<":
			if (ctx.consume_if("<@")) return [new DecoratorEndMarker()];
			return [para(ctx)];
		case "\\":
			return [para(ctx)];
		case "=": {
			ctx.consume();
			const result = callNotation(ctx, "=");
			if (is_top_level && result instanceof Meta) {
				if (ctx.doc.blocks.length)
					throw ctx.unexpected("=meta() call. Meta can only be declared at the top of a document");
				ctx.doc.meta = result;
				return undefined;
			}
			return [result as Block.Call];
		}
		case "@": {
			ctx.consume();
			const result = callNotation(ctx, "@") as Block.Decorator;
			if (ctx.consume_if(">")) {
				ctx.nomnomnom();
				return [result, new DecoratorStartMarker()];
			}
			return [result];
		}
		case "#":
			return [heading(ctx)];
		case "`":
			return [ctx.peek(0, 3) === "```" ? codeblock(ctx) : para(ctx)];
		case ">":
			return [quote(ctx) ?? para(ctx)];
		case "|":
			return [table(ctx) ?? para(ctx)];
		case "[":
			return [ctx.consume_if("[^") ? footnote(ctx) ?? para(ctx) : para(ctx)];
		case "-":
			if (ctx.consume_if("---\n")) return [new Block.Rule()];
			if (ctx.consume_if("--")) return [comment(ctx)];
			if (ctx.is("- ")) return [list(ctx)];
			return [para(ctx)];
		default:
			// Check for ordered lists
			if (/^\d+\.\s/.test(ctx.peek(0, 4))) return [list(ctx)];
			return [para(ctx)];
	}
}

export function parse_blocks<T extends boolean>(
	ctx: ParserContext,
	is_top_level: T,
): T extends true ? (Block | DecoratorEndMarker | DecoratorStartMarker)[] : Block[] {
	const blocks: (Block | DecoratorEndMarker | DecoratorStartMarker)[] = [];

	// Replace the main loop with the new version that handles arrays
	while (!ctx.eof()) {
		const block_or_blocks = parse_block(ctx, is_top_level);
		if (block_or_blocks) {
			blocks.push(...block_or_blocks);
		}
	}

	return blocks as T extends true ? (Block | DecoratorEndMarker | DecoratorStartMarker)[] : Block[];
}
