import { DecoratorEndMarker, DecoratorStartMarker } from "./common.ts";
import { ident, is_newline, is_whitespace, ParserContext } from "./Context.ts";
import { Block, HypermarkDocument, Inline, Meta } from "./types.ts";
import { try_param_value } from "./value.ts";
import { inline } from "./inline.ts";

export function param(ctx: ParserContext): Block.Parameter | undefined {
	const revert = ctx.checkpoint();

	const name = ident(ctx);
	if (!name) return undefined;

	ctx.nomnomnom();
	ctx.expect(":");
	ctx.nomnomnom();

	const value = try_param_value(ctx);
	if (value === undefined) return revert();

	return new Block.Parameter(name, value);
}

export function callNotation(
	ctx: ParserContext,
	type: "@" | "=",
): Block.Call | Block.Decorator | undefined {
	const revert = ctx.checkpoint();

	ctx.nomnom();

	const name = ident(ctx);
	if (!name) return revert();
	ctx.nomnom();

	const has_params = ctx.consume_if("(");
	const params = new Block.Parameters([]);

	if (has_params) {
		ctx.nomnomnom();

		// A single unnamed value: =warning("careful")
		const value = try_param_value(ctx);
		if (value !== undefined) {
			params.parameters.push(new Block.Parameter("__default", value));
			ctx.nomnomnom();
			if (ctx.consume_if(",")) ctx.nomnomnom();
		} else {
			// Named parameters. Whitespace is skipped before looking for `)`, so a call can
			// close on its own line with or without a trailing comma. Checked the other way
			// round, a multi-line call without one threw `Expected ","`.
			while (true) {
				ctx.nomnomnom();
				if (ctx.is(")")) break;
				if (ctx.eof()) return revert();

				if (params.parameters.length > 0) {
					// Thrown rather than reverted: two parameters with no comma between them
					// are a mistake worth naming, not text that happens to begin with `=`.
					ctx.expect(",");
					ctx.nomnomnom();
					if (ctx.is(")")) break; // a trailing comma
				}

				const parameter = param(ctx);
				if (parameter === undefined) break;
				params.parameters.push(parameter);
			}
		}

		if (!ctx.consume_if(")")) return revert();
	}

	if (type === "@") return new Block.Decorator(name, params, []);
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
		// TODO: think of a way to gracefully handle this
		else throw ctx.error("valid codeblock parameter", param);
	}

	let content = "";
	const end_string = "\n```" + (code_params.end ?? "");

	// loop as along as we don't find the end of the codeblock
	// the end is automatically consumed by consume_if
	while (!ctx.consume_if(end_string)) {
		if (ctx.eof()) break; // just allow EOF to be the end of the codeblock
		content += ctx.consume();
	}

	ctx.nomnom(); // slurp leftover whitespace after end_string

	return new Block.CodeBlock(content, code_params);
}

export function heading(ctx: ParserContext): Block.Heading | undefined {
	const revert = ctx.checkpoint();

	let level = 0;
	while (ctx.consume_if("#")) level++;
	if (level < 1 || level > 6) return revert();
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
				next === "=" ||
				next === "@" ||
				next === "["
			) {
				break;
			}

			// `--` opens a comment or a `---` rule.
			if (ctx.peek(1, 2) === "--") break;

			// A list interrupts a paragraph, but an ordered one only when it starts at 1, as
			// in CommonMark. Otherwise a wrapped line that happens to open with a number —
			// "2024. A good year" — would split the paragraph in two.
			const marker = list_marker(ctx, 1);
			if (marker && (!marker.ordered || marker.text === "1.")) break;

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
	const revert = ctx.checkpoint();

	let reference = "";
	while (ctx.not("]", "\n")) {
		if (ctx.eof()) return revert();
		reference += ctx.consume();
	}

	if (ctx.not("]")) return revert();
	ctx.consume(); // consume the closing bracket

	if (!ctx.consume_if(":")) return revert();

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
	const revert = ctx.checkpoint();

	let buffer = "";
	while (ctx.is(":", "-")) buffer += ctx.consume();

	if (buffer.length === 0) return revert();

	if (/^:?-+$/.test(buffer)) return "left";
	if (/^-+:$/.test(buffer)) return "right";
	if (/^:-+:$/.test(buffer)) return "center";

	return revert();
}

export function table(ctx: ParserContext): Block.Table | undefined {
	const revert = ctx.checkpoint();

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
				if (ctx.not("|")) return revert();

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

/** Width of a line's leading whitespace, counting a tab as `tab_size` columns. */
export function indent_width(line: string, tab_size: number): number {
	let width = 0;
	for (const char of line) {
		if (char === " ") width += 1;
		else if (char === "\t") width += tab_size;
		else break;
	}
	return width;
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

export interface ListMarker {
	ordered: boolean;
	/** The marker as written, without its trailing space: `-`, `*`, `1.`, `12.` */
	text: string;
}

/**
 * The list marker `offset` characters ahead, if there is one.
 *
 * A marker is always followed by a space. That is what tells `- item` apart from the
 * `--` comment and the `---` rule, and `* item` apart from `*strong*`.
 */
export function list_marker(ctx: ParserContext, offset = 0): ListMarker | undefined {
	const char = ctx.peek(offset);
	if ((char === "-" || char === "*") && ctx.peek(offset + 1) === " ") {
		return { ordered: false, text: char };
	}

	// Nine digits at most, as in CommonMark, so a long number opening a line is text.
	let digits = 0;
	while (digits < 9 && /[0-9]/.test(ctx.peek(offset + digits))) digits++;
	if (digits === 0 || ctx.peek(offset + digits, 2) !== ". ") return undefined;

	return { ordered: true, text: ctx.peek(offset, digits + 1) };
}

/**
 * Whether `next` continues the list `first` began.
 *
 * As in GFM, switching between ordered and unordered, or between `-` and `*`, starts a
 * new list. Matching GFM here is what makes a list read the same on GitHub as it parses.
 */
function continues_list(first: ListMarker, next: ListMarker): boolean {
	return first.ordered ? next.ordered : !next.ordered && next.text === first.text;
}

/** Consume the newline ending a line, then every whitespace-only line after it. */
function skip_blank_lines(ctx: ParserContext): void {
	ctx.consume_if("\n");
	while (true) {
		let n = 0;
		while (ctx.peek(n) === " " || ctx.peek(n) === "\t") n++;
		if (ctx.peek(n) !== "\n") return;
		ctx.consume(n + 1);
	}
}

export function list_item(ctx: ParserContext, marker: ListMarker): Block.ListItem | Block.TaskItem {
	ctx.consume(marker.text.length + 1); // the marker and its space

	// Later lines belong to the item when indented to its content column: past the
	// marker, its space, and any further spaces before the first word.
	let spaces = 0;
	while (ctx.peek(spaces) === " " || ctx.peek(spaces) === "\t") spaces++;
	const column = marker.text.length + 1 + indent_width(ctx.peek(0, spaces), ctx.tab_size);
	ctx.nomnom();

	let checked: boolean | undefined;
	if (ctx.is("[ ]", "[x]", "[X]") && /^[ \n]?$/.test(ctx.peek(3))) {
		checked = ctx.peek(1) !== " ";
		ctx.consume(3);
		ctx.nomnom();
	}

	// A blank line does not end the item by itself. The next line with text decides:
	// indented to the content column, it continues the item, so a blank line can sit
	// between two of its paragraphs; anything less indented ends it, and the blank
	// lines are left for whatever follows.
	const lines = ctx.input.slice(ctx.index).split("\n");
	let taken = 1;
	for (let i = 1; i < lines.length; ) {
		let next = i;
		while (next < lines.length && lines[next]!.trim() === "") next++;
		if (next === lines.length) break;
		if (indent_width(lines[next]!, ctx.tab_size) < column) break;
		taken = next + 1;
		i = next + 1;
	}

	const own = lines.slice(0, taken);
	ctx.consume(own.join("\n").length); // leaves the item's final newline unconsumed

	const content = own.map((line, i) => (i === 0 ? line : trim_indent(ctx, line, column))).join("\n");

	const doc2 = new HypermarkDocument();
	const opts = { tab_size: ctx.tab_size, filename: ":list:" };
	const ctx2 = new ParserContext(content, doc2, opts);
	const blocks = parse_blocks(ctx2, false);

	return checked === undefined ? new Block.ListItem(blocks) : new Block.TaskItem(blocks, checked);
}

export function list(ctx: ParserContext): Block.List | undefined {
	const first = list_marker(ctx);
	if (!first) return undefined;

	const items: (Block.ListItem | Block.TaskItem)[] = [];
	let marker: ListMarker | undefined = first;

	while (marker) {
		items.push(list_item(ctx, marker));

		// Blank lines between items keep the list going, as in GFM. Anything but another
		// item of the same list ends it, and the newlines go back to parse_blocks.
		const revert = ctx.checkpoint();
		skip_blank_lines(ctx);
		marker = list_marker(ctx);
		if (!marker || !continues_list(first, marker)) {
			revert();
			marker = undefined;
		}
	}

	return new Block.List(items, {
		start_marker: first.text,
		ordered: first.ordered,
		has_tasks: items.some(item => item.type === "task-item"),
	});
}

export function parse_blocks<T extends boolean>(
	ctx: ParserContext,
	is_top_level: T,
): T extends true ? (Block | DecoratorEndMarker | DecoratorStartMarker)[] : Block[] {
	const blocks: (Block | DecoratorEndMarker | DecoratorStartMarker)[] = [];

	// Replace the main loop with the new version that handles arrays
	while (!ctx.eof()) {
		const char = ctx.peek();

		switch (char) {
			case "\n":
				ctx.consume();
				continue;
			case "<":
				if (ctx.consume_if("<@")) {
					blocks.push(new DecoratorEndMarker());
					continue;
				}
				blocks.push(para(ctx));
				continue;
			case "\\":
				blocks.push(para(ctx));
				continue;
			case "=": {
				ctx.consume();
				const result = callNotation(ctx, "=");
				if (is_top_level && result?.type === "call" && result.name === "meta") {
					if (ctx.doc.blocks.length)
						throw ctx.unexpected(
							"=meta() call. Meta can only be declared once at the top of a document",
						);
					ctx.doc.meta = new Meta(result.parameters);
					continue;
				}
				blocks.push(result ?? para(ctx));
				continue;
			}
			case "@": {
				ctx.consume();
				const result = callNotation(ctx, "@") as Block.Decorator;
				if (ctx.consume_if(">")) {
					ctx.nomnomnom();
					blocks.push(result);
					blocks.push(new DecoratorStartMarker());
					continue;
				}
				blocks.push(result);
				continue;
			}
			case "#":
				blocks.push(heading(ctx) ?? para(ctx));
				continue;
			case "`":
				blocks.push(ctx.peek(0, 3) === "```" ? codeblock(ctx) : para(ctx));
				continue;
			case ">":
				blocks.push(quote(ctx) ?? para(ctx));
				continue;
			case "|":
				blocks.push(table(ctx) ?? para(ctx));
				continue;
			case "[":
				blocks.push(ctx.consume_if("[^") ? footnote(ctx) ?? para(ctx) : para(ctx));
				continue;
			case "-":
				if (ctx.consume_if("---\n")) blocks.push(new Block.Rule());
				else if (ctx.consume_if("--")) blocks.push(comment(ctx));
				else blocks.push(list(ctx) ?? para(ctx));
				continue;
			case "*":
				blocks.push(list(ctx) ?? para(ctx));
				continue;
			default:
				// An ordered list, or a paragraph.
				blocks.push(list(ctx) ?? para(ctx));
				continue;
		}
	}

	return blocks as T extends true ? (Block | DecoratorEndMarker | DecoratorStartMarker)[] : Block[];
}
