import { ident, locate, ParserContext } from "./Context.ts";
import { Block, HypermarkDocument, Inline, Meta } from "./types.ts";
import { try_param_string, try_param_value } from "./value.ts";
import { inline } from "./inline.ts";

export function param(ctx: ParserContext): Block.Parameter | undefined {
	const revert = ctx.checkpoint();

	const name = ident(ctx);
	if (!name) return undefined;

	ctx.nomnomnom();

	// A name without a value is a flag: `=code(…, twoslash)` means `twoslash: true`.
	if (!ctx.consume_if(":")) return new Block.Parameter(name, true);
	ctx.nomnomnom();

	const value = try_param_value(ctx);
	if (value === undefined) return revert();

	return new Block.Parameter(name, value);
}

/** A parenthesised parameter list, shared by calls, decorators and code fences. */
export function parameters(ctx: ParserContext): Block.Parameters | undefined {
	const revert = ctx.checkpoint();
	if (!ctx.consume_if("(")) return undefined;

	const params = new Block.Parameters([]);
	ctx.nomnomnom();

	// The first parameter may be unnamed: =warning("careful"), or
	// =code([bot.ts](bot.ts), region: "launch").
	const value = try_param_value(ctx);
	if (value !== undefined) params.parameters.push(new Block.Parameter("__default", value));

	// Named parameters. Whitespace is skipped before looking for `)`, so a call can close
	// on its own line with or without a trailing comma. Checked the other way round, a
	// multi-line call without one threw `Expected ","`.
	while (true) {
		ctx.nomnomnom();
		if (ctx.is(")")) break;
		if (ctx.eof()) return revert();

		if (params.parameters.length > 0) {
			// Thrown rather than reverted: two parameters with no comma between them are a
			// mistake worth naming, not text that happens to begin with `=`.
			ctx.expect(",");
			ctx.nomnomnom();
			if (ctx.is(")")) break; // a trailing comma
		}

		const parameter = param(ctx);
		if (parameter === undefined) break;
		params.parameters.push(parameter);
	}

	if (!ctx.consume_if(")")) return revert();
	return params;
}

export function callNotation(
	ctx: ParserContext,
	type: "@" | "=",
): Block.Call | Block.Decorator | undefined {
	const revert = ctx.checkpoint();

	// No space after the `=` or `@`, nor before the `(`: with one allowed, `= not a call`
	// was a call named `not`.
	const name = ident(ctx);
	if (!name) return revert();

	// A decorator takes `(…)`. A bare `@name` is text, so a username alone on its line —
	// `- @BotFather` — is not a decorator.
	if (type === "@" && ctx.not("(")) return revert();

	const params = ctx.is("(") ? parameters(ctx) : new Block.Parameters([]);
	if (params === undefined) return revert();

	if (type === "@") return new Block.Decorator(name, params, []);
	else return new Block.Call(name, params);
}

/** Nothing but spaces before the end of the line. */
function at_line_end(ctx: ParserContext): boolean {
	const revert = ctx.checkpoint();
	ctx.nomnom();
	const end = ctx.eof() || ctx.is("\n");
	revert();
	return end;
}

/**
 * A call alone on its line, or undefined with nothing consumed.
 *
 * Anything else on the line makes the whole line text. Before, the call was taken and
 * the rest became a paragraph of its own, so `=figure("a.png") A caption` split in two.
 */
export function call_line(ctx: ParserContext): Block.Call | undefined {
	const revert = ctx.checkpoint();
	const from = ctx.index;

	if (!ctx.consume_if("=")) return undefined;
	const call = callNotation(ctx, "=") as Block.Call | undefined;
	if (call === undefined || !at_line_end(ctx)) return revert();

	locate(ctx, from, call);
	ctx.nomnom(); // trailing spaces, outside the call's position: left, they became an empty paragraph
	return call;
}

/**
 * A line of decorators, alone on it, or undefined with nothing consumed.
 *
 * Decorators compose, `@style(…) @align(…)`. As for calls, anything else on the line makes
 * it text, which is what keeps a mention opening a wrapped line — "@BotFather replies" —
 * from becoming a decorator. Each decorator's position covers only itself here; it grows
 * to cover what it decorates once that is parsed.
 */
export function decorator_line(ctx: ParserContext): Block.Decorator[] | undefined {
	const revert = ctx.checkpoint();
	const line: Block.Decorator[] = [];

	while (ctx.is("@")) {
		const from = ctx.index;
		ctx.consume();
		const decorator = callNotation(ctx, "@") as Block.Decorator | undefined;
		if (decorator === undefined) return revert();
		line.push(locate(ctx, from, decorator));
		ctx.nomnom();
	}

	if (line.length === 0 || !at_line_end(ctx)) return revert();
	return line;
}

/**
 * The length of a code fence `offset` characters ahead: three or more backticks.
 *
 * As in GFM, a line whose info string holds a backtick is not a fence, so "```js `x`"
 * is inline code.
 */
export function fence_length(ctx: ParserContext, offset = 0): number | undefined {
	let length = 0;
	while (ctx.peek(offset + length) === "`") length++;
	if (length < 3) return undefined;

	for (let i = offset + length; ; i++) {
		const char = ctx.peek(i);
		if (char === "" || char === "\n") return length;
		if (char === "`") return undefined;
	}
}

/**
 * Run `parse` on a context that ends where the current line does.
 *
 * A fence's opening line is all GitHub reads as its info string, so nothing parsed
 * from it may continue onto the body. The text is a prefix of this context's own, so
 * the source map carries over and errors still point at the real line and column.
 */
function on_this_line<T>(ctx: ParserContext, parse: (line: ParserContext) => T): T {
	let end = ctx.input.indexOf("\n", ctx.index);
	if (end === -1) end = ctx.input.length;

	const line = new ParserContext(ctx.input.slice(0, end), ctx.doc, {
		tab_size: ctx.tab_size,
		filename: ctx.filename,
		source: ctx.source,
	});
	line.index = ctx.index;

	const result = parse(line);

	ctx.index = line.index;
	return result;
}

/**
 * A word on a fence's opening line: the language, or a title without spaces.
 *
 * A `(` inside one is a missing space. GitHub takes everything up to the first space
 * as the language, so ```` ```ts(twoslash) ```` loses its highlighting there.
 */
function fence_word(ctx: ParserContext): string {
	let word = "";
	while (!ctx.eof() && ctx.not(" ", "\t")) {
		if (ctx.is("(")) throw ctx.error("a space before (", "(");
		word += ctx.consume();
	}
	return word;
}

/** `lang [title] [(params)]`: everything on a fence's opening line after the backticks. */
function fence_info(ctx: ParserContext): Block.CodeBlockOptions {
	ctx.nomnom();
	const options: Block.CodeBlockOptions = { language: fence_word(ctx) };
	ctx.nomnom();

	if (ctx.is('"', "'")) {
		const title = try_param_string(ctx);
		if (title === undefined) throw ctx.error("a closing quote", "the end of the line");
		options.title = title;
	} else if (!ctx.eof() && ctx.not("(")) {
		options.title = fence_word(ctx);
	}
	ctx.nomnom();

	if (ctx.is("(")) {
		const params = parameters(ctx);
		if (params === undefined) throw ctx.error(") on the same line", "the end of the line");
		options.params = params;
		ctx.nomnom();
	}

	if (!ctx.eof()) throw ctx.error("the end of the line", ctx.peek());
	return options;
}

export function codeblock(ctx: ParserContext): Block.CodeBlock | undefined {
	const length = fence_length(ctx);
	if (length === undefined) return undefined;
	const from = ctx.index;
	ctx.consume(length);

	const options = on_this_line(ctx, fence_info);
	ctx.consume_if("\n");

	// As in GFM: a fence closes on a line of at least as many backticks and nothing else,
	// indented by up to three spaces. A longer fence is how a block shows a shorter one.
	const closer = new RegExp(`^ {0,3}\`{${length},}[ \\t]*$`);

	const lines: string[] = [];
	let position = ctx.index;
	while (position < ctx.input.length) {
		let end = ctx.input.indexOf("\n", position);
		if (end === -1) end = ctx.input.length;

		const line = ctx.input.slice(position, end);
		if (closer.test(line)) {
			position = end;
			break;
		}

		lines.push(line);
		position = end + 1;
	}

	// An unclosed fence runs to the end of the document, as in GFM.
	ctx.consume(Math.min(position, ctx.input.length) - ctx.index);

	return locate(ctx, from, new Block.CodeBlock(lines.join("\n"), options));
}

/**
 * The level of a heading `offset` characters ahead: one to six `#`, then a space or tab.
 *
 * Without the space, a `#hashtag` opening a line was a heading.
 */
export function heading_level(ctx: ParserContext, offset = 0): Block.HeadingLevel | undefined {
	let level = 0;
	while (ctx.peek(offset + level) === "#") level++;
	if (level < 1 || level > 6) return undefined;
	const after = ctx.peek(offset + level);
	return after === " " || after === "\t" ? (level as Block.HeadingLevel) : undefined;
}

export function heading(ctx: ParserContext): Block.Heading | undefined {
	const level = heading_level(ctx);
	if (level === undefined) return undefined;

	const from = ctx.index;
	ctx.consume(level);
	const content = inline(ctx, "\n");
	return locate(ctx, from, new Block.Heading(level, content));
}

/** Whether a footnote definition, `[^ref]: …`, starts `offset` characters ahead. */
function is_footnote_definition(ctx: ParserContext, offset = 0): boolean {
	if (ctx.peek(offset, 2) !== "[^") return false;
	for (let i = offset + 2; ; i++) {
		const char = ctx.peek(i);
		if (char === "" || char === "\n") return false;
		if (char === "]") return ctx.peek(i + 1) === ":";
	}
}

// paragraph parser, typically ends when two newlines are encountered
// or when a decorator, list, call, or code block is encountered
export function para(ctx: ParserContext) {
	const from = ctx.index;
	let inline_list: Inline[] = [];

	while (!ctx.eof()) {
		// Check for block-level elements in next line
		if (ctx.is("\n")) {
			const next = ctx.peek(1);

			if (next === ">" || next === "|") break;

			// A heading or a footnote definition, checked in full: on the first character
			// alone, `#hashtag` or a link opening a wrapped line split the paragraph.
			if (heading_level(ctx, 1) !== undefined || is_footnote_definition(ctx, 1)) break;

			// A call or decorators alone on the next line. A line that merely starts with
			// `=` or `@` — "@BotFather replies" — stays in this paragraph.
			if (next === "=" || next === "@") {
				const revert = ctx.checkpoint();
				ctx.consume(); // the newline
				const ahead = next === "=" ? call_line(ctx) : decorator_line(ctx);
				revert();
				if (ahead) break;
			}

			// `--` opens a comment or a `---` rule.
			if (ctx.peek(1, 2) === "--") break;

			// A fence, but not inline code that happens to open a wrapped line.
			if (fence_length(ctx, 1) !== undefined) break;

			// A list interrupts a paragraph, but an ordered one only when it starts at 1, as
			// in CommonMark. Otherwise a wrapped line that happens to open with a number —
			// "2024. A good year" — would split the paragraph in two.
			const marker = list_marker(ctx, 1);
			if (marker && (!marker.ordered || marker.text === "1.")) break;

			// Double newline still breaks
			if (next === "\n") break;

			// Add single newline as text and continue
			const newline = ctx.index;
			ctx.consume();
			inline_list.push(locate(ctx, newline, new Inline.Text("\n")));
			continue;
		}

		const chunk = inline(ctx, "\n");
		inline_list.push(...chunk);
	}

	return locate(ctx, from, new Block.Paragraph(inline_list));
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
	const from = ctx.index;
	let to = from;
	let buffer = "";
	// Where each line of `buffer` starts in this context's text, past its `> `.
	const starts: number[] = [];

	outer: while (ctx.consume_if(">")) {
		ctx.nomnom();
		starts.push(ctx.index);
		while (ctx.not("\n")) {
			if (ctx.eof()) {
				to = ctx.index;
				break outer;
			}
			buffer += ctx.consume();
		}
		to = ctx.index;
		buffer += ctx.consume(); // include the newline
	}

	const doc2 = new HypermarkDocument();
	const ctx2 = new ParserContext(buffer, doc2, {
		tab_size: ctx.tab_size,
		filename: ctx.filename,
		source: ctx.source.derive(buffer, starts),
	});
	const reparse = parse_blocks(ctx2, false);

	return locate(ctx, from, new Block.Quote(reparse), to);
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
	const from = ctx.index;
	let to = from;

	let header: Block.TableRow | undefined = undefined;
	const rows: Block.TableRow[] = [];
	let alignment: Block.TableAlignmentRow | undefined = undefined;

	// row starts with |
	while (ctx.is("|")) {
		const row_from = ctx.index;
		let row = new Block.TableRow([]);
		let is_alignment_row = false;

		// cell starts with |
		while (ctx.consume_if("|")) {
			ctx.nomnom();
			if (ctx.is("\n") || ctx.eof()) break;

			const cell_from = ctx.index;
			const align = try_alignment(ctx);

			// first cell in this row is an alignment cell
			// AND this is the second row (rows already has 1 row)
			if (align && (rows.length === 1 || (rows.length === 0 && header))) {
				// pop the first row and use it as the header
				if (!header) header = rows.pop()!;

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

				row.cells.push(locate(ctx, cell_from, new Block.TableCell(content)));
			}
		}

		to = ctx.index;
		if (!is_alignment_row) rows.push(locate(ctx, row_from, row));
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

	return locate(ctx, from, new Block.Table(rows, header, alignment), to);
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
	const from = ctx.index;
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

	const label = checked === undefined ? item_label(ctx) : undefined;

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

	// Where each line of the item's copy starts in this context's text, past its indent.
	const starts: number[] = [];
	let line_from = ctx.index;
	const copied = own.map((line, i) => {
		const kept = i === 0 ? line : trim_indent(ctx, line, column);
		starts.push(line_from + line.length - kept.length);
		line_from += line.length + 1;
		return kept;
	});
	const content = copied.join("\n");

	ctx.consume(own.join("\n").length); // leaves the item's final newline unconsumed

	const doc2 = new HypermarkDocument();
	const ctx2 = new ParserContext(content, doc2, {
		tab_size: ctx.tab_size,
		filename: ctx.filename,
		source: ctx.source.derive(content, starts),
	});
	const blocks = parse_blocks(ctx2, false);

	const item = checked === undefined ? new Block.ListItem(blocks, label) : new Block.TaskItem(blocks, checked);
	return locate(ctx, from, item);
}

/**
 * A label alone on an item's first line, `- [npm]`, or undefined with nothing consumed.
 *
 * Read where the task box is, and like it: metadata on the item, not content. It must be
 * alone on the line, so `- [optional] Add a webhook` stays text and `- [Telegraf](…)`
 * stays a link, as they are on GitHub, which shows `[npm]` as written.
 */
function item_label(ctx: ParserContext): Inline[] | undefined {
	const revert = ctx.checkpoint();
	if (!ctx.consume_if("[")) return undefined;

	const label = inline(ctx, "]");
	if (label.length === 0 || !ctx.consume_if("]") || !at_line_end(ctx)) return revert();

	ctx.nomnom();
	return label;
}

export function list(ctx: ParserContext): Block.List | undefined {
	const first = list_marker(ctx);
	if (!first) return undefined;
	const from = ctx.index;

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

	const options = {
		start_marker: first.text,
		ordered: first.ordered,
		has_tasks: items.some(item => item.type === "task-item"),
	};
	return locate(ctx, from, new Block.List(items, options));
}

export function parse_blocks(ctx: ParserContext, is_top_level: boolean): Block[] {
	const blocks: Block[] = [];
	for (let block; (block = next_block(ctx, is_top_level)); ) blocks.push(block);
	return blocks;
}

/**
 * The block a line of decorators decorates, wrapped by them: `@a() @b()` over `X` is
 * `a(b(X))`, each decorator's position growing to cover what it decorates.
 *
 * To decorate several blocks, a document decorates a block that holds several: a list or
 * a quote. There is no container form, so nothing has to be closed or counted.
 */
function decorate(ctx: ParserContext, from: number, line: Block.Decorator[]): Block {
	const target = next_block(ctx, false);
	if (target === undefined) {
		ctx.index = from; // report the decorator, not the end of the text
		throw ctx.error("a block for the decorator to decorate", "the end of the document");
	}

	let block: Block = target;
	for (const decorator of line.toReversed()) {
		decorator.blocks = [block];
		if (decorator.position && target.position) {
			decorator.position = { start: decorator.position.start, end: target.position.end };
		}
		block = decorator;
	}
	return block;
}

/** The next block past any blank lines, or undefined at the end of the text. */
function next_block(ctx: ParserContext, is_top_level: boolean): Block | undefined {
	while (!ctx.eof()) {
		switch (ctx.peek()) {
			case "\n":
				ctx.consume();
				continue;
			case "=": {
				// Text that is not a call keeps its `=`: call_line consumes nothing when it fails.
				const call = call_line(ctx);
				if (call === undefined) return para(ctx);
				if (is_top_level && call.name === "meta") {
					if (ctx.doc.blocks.length)
						throw ctx.unexpected(
							"=meta() call. Meta can only be declared once at the top of a document",
						);
					const meta = new Meta(call.parameters);
					meta.position = call.position;
					ctx.doc.meta = meta;
					continue;
				}
				return call;
			}
			case "@": {
				// As for `=`. A failed decorator used to push `undefined` into the blocks.
				const from = ctx.index;
				const line = decorator_line(ctx);
				return line === undefined ? para(ctx) : decorate(ctx, from, line);
			}
			case "#":
				return heading(ctx) ?? para(ctx);
			case "`":
				return codeblock(ctx) ?? para(ctx);
			case ">":
				return quote(ctx) ?? para(ctx);
			case "|":
				return table(ctx) ?? para(ctx);
			case "[": {
				// As for `=`: text that is not a footnote used to lose its `[^`.
				const from = ctx.index;
				const revert = ctx.checkpoint();
				const note = ctx.consume_if("[^") ? footnote(ctx) : undefined;
				if (note === undefined) revert();
				return note ? locate(ctx, from, note) : para(ctx);
			}
			case "-": {
				const from = ctx.index;
				if (ctx.is("---\n")) {
					ctx.consume(3);
					const rule = locate(ctx, from, new Block.Rule());
					ctx.consume(); // the newline, outside the rule's position
					return rule;
				}
				if (ctx.consume_if("--")) return locate(ctx, from, comment(ctx));
				return list(ctx) ?? para(ctx);
			}
			default:
				// `*` or digits for a list; anything else a paragraph.
				return list(ctx) ?? para(ctx);
		}
	}
	return undefined;
}
