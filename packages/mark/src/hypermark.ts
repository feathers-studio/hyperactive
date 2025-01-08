import { Block, Inline, HypermarkDocument, type Value, Meta } from "./types.ts";
import { ParseError, DecoratorEndMarker, DecoratorStartMarker, limited_log } from "./common.ts";
import { color, inspect } from "bun";

const normalLineNumber = (line_number: number) => {
	let num = line_number.toString();
	if (num.length > 3) num = "-" + num.slice(-3);
	else if (num.length < 4) num = num.padStart(4, " ");
	return num;
};

const getLineNeighbours = (input: string, line_number: number, count: number = 5): string[] => {
	const lines = input.split("\n");
	return lines
		.slice(Math.max(0, line_number - count), line_number)
		.map((line, i) => `${normalLineNumber(line_number - count + i)} | ${line}`);
};

const squiggly = (column: number) => {
	return color("red", "ansi") + " ".repeat(7 + column - 1) + "^^^" + "\x1b[0m";
};

export interface ParseOptions {
	tab_size?: number;
}

export function parse(input: string, filename?: string, options: ParseOptions = { tab_size: 4 }) {
	const tab_size = options.tab_size ?? 4;

	const countChar = (char: string, from: number, to: number) => {
		let count = 0;
		let last_index = -1;
		for (let i = from; i < to; i++) {
			if (input[i] === char) {
				count++;
				last_index = i - from;
			}
		}
		return { count, last_index };
	};

	const doc = new HypermarkDocument([]);

	let i = 0;
	let line = 1;
	let column = 1;

	const capture_error_presentation = (error: string) => {
		const file = filename ?? ":";
		let message = "\n\n\n";
		message += getLineNeighbours(input, line).join("\n");
		message += `\n${squiggly(column)}\n`;
		message += `\n${error}\n`;
		message += " ".repeat(8) + `at ${file}:${line}:${column}\n`;
		return message;
	};

	const error = (expected: string, found: string) => {
		let message = `Expected "${expected}", found "${found.replace(/\n/g, "\\n")}"\n`;
		return new ParseError(i, line, column, capture_error_presentation(message), filename);
	};

	const unexpected = (found: string) => {
		let message = `Unexpected "${found.replace(/\n/g, "\\n")}"\n`;
		return new ParseError(i, line, column, capture_error_presentation(message), filename);
	};

	const peek = (offset: number = 0, count: number = 1) => {
		return input.slice(i + offset, i + offset + count);
	};

	const revert = (index: number): undefined => {
		i = index;
		return undefined;
	};

	const eof = () => {
		return i >= input.length;
	};

	const is = (...str: (string | RegExp)[]) => {
		return str.some(s => {
			if (typeof s === "string") return peek(0, s.length) === s;
			return s.test(peek());
		});
	};

	const not = (...str: (string | RegExp)[]) => {
		return !is(...str);
	};

	const consume = (n: number | string = 1) => {
		if (typeof n === "string") {
			if (not(n)) throw error(n, peek() ?? "EOF");
			n = n.length;
		}

		const slice = input.slice(i, i + n);
		const count = countChar("\n", i, i + n);
		i += n;

		if (count.count > 0) {
			// If we found newlines, update line and reset column
			line += count.count;
			// Column should be the number of characters after the last newline + 1
			column = count.last_index === -1 ? 1 : n - count.last_index;
		} else {
			// If no newlines, just increment the column
			column += n;
		}

		return slice;
	};

	const consume_if = (str: string): string | undefined => {
		if (is(str)) return consume(str.length);
		return undefined;
	};

	const expect = (str: string) => {
		if (not(str)) throw error(str, peek());
		consume(str.length);
	};

	function is_newline() {
		return is("\n");
	}

	function is_inline_whitespace() {
		return is(" ") || is("\t");
	}

	function is_whitespace() {
		return is_inline_whitespace() || is_newline();
	}

	function nomnom() {
		while (is_inline_whitespace()) consume();
	}

	function nomnomnom() {
		while (is_whitespace()) consume();
	}

	function parse_block(): (Block | DecoratorEndMarker | DecoratorStartMarker)[] | undefined {
		if (eof()) return undefined;

		const char = peek();

		switch (char) {
			case "\n":
				consume();
				return undefined;
			case "<":
				if (consume_if("<@")) return [new DecoratorEndMarker()];
				return [para()];
			case "\\":
				return [para()];
			case "=": {
				consume();
				const result = callNotation("=");
				if (result instanceof Meta) {
					if (doc.blocks.length)
						throw unexpected("=meta() call. Meta can only be declared at the top of a document");
					doc.meta = result;
					return undefined;
				}
				return [result as Block.Call];
			}
			case "@": {
				consume();
				const result = callNotation("@") as Block.Decorator;
				if (consume_if(">")) {
					nomnomnom();
					return [result, new DecoratorStartMarker()];
				}
				return [result];
			}
			case "#":
				return [heading()];
			case "`":
				return [peek(0, 3) === "```" ? codeblock() : para()];
			case ">":
				return [quote() ?? para()];
			case "|":
				return [table() ?? para()];
			case "[":
				return [consume_if("[^") ? footnote() ?? para() : para()];
			case "-":
				if (consume_if("---\n")) return [new Block.Rule()];
				if (consume_if("--")) return [comment()];
				if (is("- ")) return [list()];
				return [para()];
			default:
				// Check for ordered lists
				if (/^\d+\.\s/.test(peek(0, 4))) return [list()];
				return [para()];
		}
	}

	function parse_blocks(): (Block | DecoratorEndMarker | DecoratorStartMarker)[] {
		const blocks: (Block | DecoratorEndMarker | DecoratorStartMarker)[] = [];

		// Replace the main loop with the new version that handles arrays
		while (!eof()) {
			const block_or_blocks = parse_block();
			if (block_or_blocks) {
				blocks.push(...block_or_blocks);
			}
		}

		return blocks;
	}

	function ident(): string | undefined {
		let buffer = "";
		if (is(/^[A-Za-z_]$/)) buffer += consume();
		while (is(/^[A-Za-z0-9_-]$/)) buffer += consume();
		return buffer.length > 0 ? buffer : undefined;
	}

	// #region Value

	// TODO: escape \"
	function try_param_string(): string | undefined {
		if (not('"')) return undefined;
		consume();

		let buffer = "";
		while (not('"')) {
			// found end of file before closing quote
			if (eof()) throw error('"', "EOF");
			buffer += consume();
		}

		consume(); // consume the closing quote
		return buffer;
	}

	function try_param_number(): number | undefined {
		const checkpoint = i;
		let buffer = "";

		while (is(/^[0-9]$/)) buffer += consume();
		// if didn't find a number to parse
		if (buffer.length === 0) return revert(checkpoint);

		if (is(".")) {
			buffer += consume();
			let decimal = "";
			while (is(/^[0-9]$/)) decimal += consume();

			//if  only found a dot, not a decimal
			if (decimal.length === 0) return revert(checkpoint);

			buffer += "." + decimal;
		}

		return parseFloat(buffer);
	}

	function try_param_null(): null | undefined {
		if (consume_if("null")) return null;
		return undefined;
	}

	function try_param_boolean(): boolean | undefined {
		if (consume_if("true")) return true;
		if (consume_if("false")) return false;
		return undefined;
	}

	function try_param_list(): Value[] | undefined {
		const params: Value[] = [];

		if (not("[")) return undefined;
		consume(); // consume the opening bracket

		let first = true;
		while (not("]")) {
			nomnomnom();

			if (eof()) throw error("]", "EOF");

			// expect a comma if not the first value
			// trailing commas are required at the moment
			// even empty lists are required to have a comma
			// TODO: fix this
			if (!first) expect(",");
			nomnomnom();

			const value = try_param_value();
			if (value === undefined) break;
			params.push(value);

			first = false;
		}

		if (not("]")) throw error("]", peek());
		consume(); // consume the closing bracket
		return params;
	}

	function try_param_object(): { [key: string]: Value } | undefined {
		const params: { [key: string]: Value } = {};

		if (not("{")) return undefined;
		consume(); // consume the opening bracket
		nomnomnom();

		let first = true;
		while (not("}")) {
			nomnomnom();

			if (eof()) throw error("}", "EOF");

			// expect a comma if not the first value
			// trailing commas are required at the moment
			// even empty objects are required to have a comma
			// TODO: fix this
			if (!first) expect(",");
			nomnomnom();

			const key = ident();
			// didn't find a key, could not parse an object
			if (!key) break;
			nomnomnom();

			expect(":");
			nomnomnom();

			const value = try_param_value();
			// didn't find a value, could not parse an object
			if (value === undefined) throw error("value", peek());
			params[key] = value;
			first = false;
		}

		if (not("}")) throw error("}", peek());
		consume(); // consume the closing bracket
		return params;
	}

	function try_param_value(): Value | undefined {
		let value: Value | undefined;

		if ((value = try_param_string()) !== undefined) return value;
		if ((value = try_param_number()) !== undefined) return value;
		if ((value = try_param_null()) !== undefined) return value;
		if ((value = try_param_boolean()) !== undefined) return value;
		if ((value = try_param_list()) !== undefined) return value;
		if ((value = try_param_object()) !== undefined) return value;
		return undefined;
	}

	// #endregion Value

	function param(): Block.Parameter | undefined {
		const name = ident();
		if (!name) return undefined;

		nomnomnom();
		expect(":");
		nomnomnom();

		const value = try_param_value();
		if (value === undefined) throw error("value", peek());

		return new Block.Parameter(name, value);
	}

	function callNotation(type: "@" | "="): Block.Call | Block.Decorator | Meta {
		nomnom();

		const name = ident();
		if (!name) throw error("identifier", peek());
		nomnom();

		const has_params = consume_if("(");
		const params = new Block.Parameters([]);

		if (has_params) {
			// try to parse a single value
			const value = try_param_value();
			if (value !== undefined) {
				const param = new Block.Parameter("__default", value);
				params.parameters.push(param);
			} else {
				// parse multiple named parameters
				let first = true;

				while (not(")")) {
					nomnomnom();

					if (eof()) throw error(")", "EOF");

					// expect a comma if not the first value
					// trailing commas are required at the moment
					// even empty objects are required to have a comma
					// TODO: fix this
					if (!first) expect(",");
					nomnomnom();

					const parameter = param();
					if (parameter === undefined) break;
					params.parameters.push(parameter);

					first = false;
				}
			}

			if (not(")")) throw error(")", peek());
			consume(); // consume the closing parenthesis
		}

		if (type === "@") return new Block.Decorator(name, params, []);
		else if (name === "meta") return new Meta(params);
		else return new Block.Call(name, params);
	}

	// TODO: =import() calls within codeblocks?
	function codeblock() {
		consume("```");

		let language = "";
		while (!is_whitespace()) language += consume();
		nomnom();

		let params = "";
		while (!is_newline()) params += consume();
		consume(); // consume the newline

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
			else throw error("valid codeblock parameter", param);
		}

		let content = "";
		const end_string = "\n```" + (code_params.end ?? "");

		// loop as along as we don't find the end of the codeblock
		// the end is automatically consumed by consume_if
		while (!consume_if(end_string)) {
			if (eof()) throw error("end of codeblock", "EOF");
			content += consume();
		}

		nomnom(); // slurp leftover whitespace after end_string

		return new Block.CodeBlock(content, code_params);
	}

	// #region Inline

	function try_link(): Inline.Link | undefined {
		const checkpoint = i;

		if (!consume_if("[")) return undefined;

		const content = inline("]", "[", "![") as Exclude<Inline, { type: "link" | "image" }>[];

		if (!consume_if("](")) return revert(checkpoint);

		let href = "";
		while (not(")", "\n")) {
			if (eof()) return revert(checkpoint);
			href += consume();
		}

		if (!consume_if(")")) return revert(checkpoint);

		return new Inline.Link(content, href);
	}

	function try_image(): Inline.Image | undefined {
		const checkpoint = i;

		if (!consume_if("!")) return undefined;

		const link = try_link();
		if (link === undefined) return revert(checkpoint);

		return new Inline.Image(link.content, link.href);
	}

	function try_matching_inline(char: string): Inline[] | undefined {
		const checkpoint = i;

		if (!consume_if(char)) return undefined;

		const content = inline(char, "\n");

		if (content.length === 0 || not(char)) return revert(checkpoint);

		consume(char); // consume the closing char

		return content;
	}

	function try_strong(): Inline.Strong | undefined {
		const content = try_matching_inline("*") as Exclude<Inline, Inline.Strong>[];
		if (content === undefined) return undefined;
		return new Inline.Strong(content);
	}

	function try_strike(): Inline.Strike | undefined {
		const content = try_matching_inline("~~") as Exclude<Inline, Inline.Strike>[];
		if (content === undefined) return undefined;
		return new Inline.Strike(content);
	}

	/** MUST be tried before try_emphasis */
	function try_underline(): Inline.Underline | undefined {
		const content = try_matching_inline("__") as Exclude<Inline, Inline.Underline>[];
		if (content === undefined) return undefined;
		return new Inline.Underline(content);
	}

	function try_emphasis(): Inline.Emphasis | undefined {
		const content = try_matching_inline("_") as Exclude<Inline, Inline.Emphasis>[];
		if (content === undefined) return undefined;
		return new Inline.Emphasis(content);
	}

	function try_code(): Inline.Code | undefined {
		const checkpoint = i;

		if (!consume_if("`")) return undefined;

		// Just capture raw text until the next backtick
		let content = "";
		while (not("`", "\n")) {
			if (eof()) return revert(checkpoint);
			content += consume();
		}

		if (not("`") || content.length === 0) return revert(checkpoint);

		consume(); // consume the closing backtick
		return new Inline.Code(content);
	}

	function try_variable_interpolation(): Inline.VariableInterpolation | undefined {
		const checkpoint = i;

		if (!consume_if("${")) return undefined;

		// TODO: support expressions
		let name = "";
		while (not("}", "\n")) {
			if (eof()) return revert(checkpoint);
			name += consume();
		}

		if (not("}")) return revert(checkpoint);

		consume(); // consume the closing brace
		return new Inline.VariableInterpolation(name);
	}

	function try_footnote_reference(): Inline.FootnoteReference | undefined {
		const checkpoint = i;

		if (!consume_if("[^")) return undefined;

		let reference = "";
		while (not("]", "\n")) {
			if (eof()) return revert(checkpoint);
			reference += consume();
		}

		if (not("]")) return revert(checkpoint);

		consume(); // consume the closing bracket

		return new Inline.FootnoteReference(reference);
	}

	function inline(...untilChar: string[]): Inline[] {
		const content: Inline[] = [];
		let buffer = "";

		const add = (chunk: Inline) => {
			if (buffer.length > 0) content.push(new Inline.Text(buffer));
			buffer = "";
			content.push(chunk);
		};

		// Ignore whitespace at the start of the inline
		nomnom();

		while (not(...untilChar, "\n")) {
			if (eof()) break;

			let chunk: Inline | undefined;

			// escape character
			if (consume_if("\\")) buffer += consume();
			else if ((chunk = try_strong())) add(chunk);
			else if ((chunk = try_strike())) add(chunk);
			else if ((chunk = try_underline())) add(chunk);
			else if ((chunk = try_emphasis())) add(chunk);
			else if ((chunk = try_code())) add(chunk);
			else if ((chunk = try_link())) add(chunk);
			else if ((chunk = try_image())) add(chunk);
			else if ((chunk = try_footnote_reference())) add(chunk);
			else if ((chunk = try_variable_interpolation())) add(chunk);
			else buffer += consume();
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

	// #endregion Inline

	function heading() {
		let level = 0;
		while (consume_if("#")) level++;
		if (level < 1 || level > 6) throw error("heading level 1-6", peek());
		const content = inline("\n");
		return new Block.Heading(level as Block.HeadingLevel, content);
	}

	// paragraph parser, typically ends when two newlines are encountered
	// or when a decorator, list, call, or code block is encountered
	function para() {
		let inline_list: Inline[] = [];

		while (!eof()) {
			// Check for block-level elements in next line
			if (is("\n")) {
				const next = peek(1);

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
				consume();
				continue;
			}

			const chunk = inline("\n");
			inline_list.push(...chunk);
		}

		return new Block.Paragraph(inline_list);
	}

	function footnote() {
		let checkpoint = i;

		let reference = "";
		while (not("]", "\n")) {
			if (eof()) return revert(checkpoint);
			reference += consume();
		}

		if (not("]")) return revert(checkpoint);
		consume(); // consume the closing bracket

		if (!consume_if(":")) return revert(checkpoint);

		nomnom();

		const content = inline("\n");

		const footnote = new Block.Footnote(reference, content);
		doc.footnote_collection[reference] = footnote;
		return footnote;
	}

	function comment() {
		nomnom();

		let buffer = "";
		while (not("\n")) {
			if (eof()) break;
			buffer += consume();
		}

		return new Block.Comment(buffer);
	}

	function quote(): Block.Quote | undefined {
		let buffer = "";

		outer: while (consume_if(">")) {
			nomnom();
			while (not("\n")) {
				if (eof()) break outer;
				buffer += consume();
			}
			buffer += consume(); // include the newline
		}

		const reparse = parse(buffer, ":quote:");

		return new Block.Quote(reparse.blocks);
	}

	function try_alignment(): Block.TableAlignment | undefined {
		const checkpoint = i;

		let buffer = "";
		while (is(":", "-")) buffer += consume();

		if (buffer.length === 0) return revert(checkpoint);

		if (/^:?-+$/.test(buffer)) return "left";
		if (/^-+:$/.test(buffer)) return "right";
		if (/^:-+:$/.test(buffer)) return "center";

		return revert(checkpoint);
	}

	function table(): Block.Table | undefined {
		const checkpoint = i;

		let header: Block.TableRow | undefined = undefined;
		const rows: Block.TableRow[] = [];
		let alignment: Block.TableAlignmentRow | undefined = undefined;

		// row starts with |
		while (is("|")) {
			let row = new Block.TableRow([]);
			let is_alignment_row = false;

			// cell starts with |
			while (consume_if("|")) {
				nomnom();
				if (is("\n") || eof()) break;

				const align = try_alignment();

				// first cell in this row is an alignment cell
				// AND this is the second row (rows already has 1 row)
				if (align && (rows.length === 1 || (rows.length === 0 && header))) {
					// pop the first row and use it as the header
					if (!header) header = new Block.TableRow(rows.pop()!.cells);

					if (!alignment) alignment = new Block.TableAlignmentRow([]);
					alignment.alignment.push(align);

					nomnom();

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

					const content = inline("|");
					if (not("|")) return revert(checkpoint);

					row.cells.push(new Block.TableCell(content));
				}
			}

			if (!is_alignment_row) rows.push(row);
			consume_if("\n");
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

	function get_indent(from_offset: number, tab_size: number): number {
		let indent = 0;
		let index = from_offset;

		while (peek(index) === " " || peek(index) === "\t") {
			indent += peek(index) === " " ? 1 : tab_size;
			index++;
		}

		return indent;
	}

	function trim_indent(line: string, indent: number, tab_size: number): string {
		let index = 0;
		let indent_level = 0;

		while (indent_level < indent) {
			if (line[index] === " " || line[index] === "\t") {
				indent_level += line[index] === " " ? 1 : tab_size;
				index++;
			} else break;
		}

		return line.slice(index);
	}

	function list_item(indent_level: number): Block.ListItem | undefined {
		let checkpoint = i;

		console.log({ indent_level });

		if (!consume_if("- ")) return undefined;

		indent_level += 2; // for the marker
		indent_level += get_indent(i, tab_size); // whitespace before content adds to current indent level

		let content = "";

		while (!eof()) {
			if (is("\n") && peek(1) !== "\n") {
				// if the next line is indented less than the current indent level, break
				if (get_indent(1, tab_size) < indent_level) break;
				content += consume();
			}
			content += consume();
		}

		const normalised_content = content
			.split("\n")
			.map(line => trim_indent(line, indent_level, tab_size))
			.join("\n");

		console.log({ normalised_content });

		const block = parse(normalised_content, ":list:", { tab_size });

		return new Block.ListItem(block.blocks);
	}

	function list(): Block.List {
		const items: Block.ListItem[] = [];

		let item: Block.ListItem | undefined;

		while ((item = list_item(0))) {
			items.push(item);
		}

		return new Block.List(items);
	}

	// [^1]: decorators should be normalised after parsing
	// [^2]: Also lists

	// @ts-expect-error normalise decorators after parsing
	doc.blocks = parse_blocks();
	return doc;
}
