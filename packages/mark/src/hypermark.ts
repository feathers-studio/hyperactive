import { Block, Inline, AST, type Value, Meta } from "./types.ts";
import { color } from "bun";

class ParseError extends Error {
	constructor(
		public index: number,
		public line: number,
		public column: number,
		message: string,
		public filename?: string,
	) {
		super(message);
		this.name = "ParseError";
	}
}

class UnexpectedSyntax extends ParseError {
	constructor(index: number, line: number, column: number, syntax: string, filename?: string) {
		super(index, line, column, `Unexpected ${syntax}`, filename);
		this.name = "UnexpectedSyntax";
	}
}

class DecoratorStartMarker {
	type: "decorator-start" = "decorator-start";
	toString(): string {
		return ">";
	}
}

class DecoratorEndMarker {
	type: "decorator-end" = "decorator-end";
	toString(): string {
		return "<@";
	}
}

const limited_log = (n: number) => {
	return (...args: any[]) => {
		if (n > 0) {
			console.log(...args);
			n--;
		}
	};
};

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

export function parse(input: string, filename?: string) {
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

	let ast = new AST([]);

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

	const consume_until = (str: string) => {
		let buffer = "";
		while (not(str)) buffer += consume();
		return buffer;
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

	let blocks: (Block | DecoratorEndMarker | DecoratorStartMarker)[] = ast.blocks;

	// master loop decides which block type to parse
	while (i < input.length) {
		const char = peek();

		switch (char) {
			case "\n":
				consume();
				continue;
			case "<":
				if (consume_if("<@")) blocks.push(new DecoratorEndMarker());
				else blocks.push(para());
				break;
			case "\\":
				blocks.push(para());
				break;
			case "=": {
				const result = call();
				if (result instanceof Meta) {
					if (ast.blocks.length)
						throw unexpected("=meta() call. Meta can only be declared at the top of a document");
					else ast.meta = result;
				} else blocks.push(result);
				break;
			}
			case "@": {
				const result = decorator();
				blocks.push(result);
				// decorators should be normalised in a second pass of the AST [^1]
				if (consume_if(">")) {
					nomnomnom();
					blocks.push(new DecoratorStartMarker());
				}
				break;
			}
			case "#":
				blocks.push(heading());
				break;
			case "`":
				if (peek(0, 3) === "```") blocks.push(codeblock());
				break;
			// case "|":
			// 	table();
			// 	break;
			case "[":
				if (consume_if("[^")) blocks.push(footnote());
				else blocks.push(para());
				break;
			case "-":
				if (consume_if("---\n")) blocks.push(new Block.Rule());
				else if (consume_if("--")) blocks.push(comment());
				else blocks.push(para());
				break;
			default:
				// if (/^\s*[-*]/.test(peek(3))) list();
				// else if (/^\s*[0-9]\. /.test(peek(3))) ordered_list();
				// else
				blocks.push(para());
				break;
		}
	}

	function ident(): string | undefined {
		let buffer = "";
		if (is(/^[A-Za-z_]$/)) buffer += consume();
		while (is(/^[A-Za-z0-9_-]$/)) buffer += consume();
		return buffer.length > 0 ? buffer : undefined;
	}

	// #region Value

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

	function call() {
		consume();
		return callNotation("=") as Block.Call | Meta;
	}

	function decorator() {
		consume();
		return callNotation("@") as Block.Decorator;
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
					code_params.highlight = value.split(",").map(range => {
						const [start, end] = range.split("-");
						return { start: Number(start), end: Number(end) };
					});
				else if (key === "end") code_params.end = value;
			} else if (!code_params.title) code_params.title = param;
			else throw error("valid codeblock parameter", param);
		}

		let content = "";
		const end_string = code_params.end ? " " + code_params.end : "";
		const expect = "\n```" + end_string;

		// loop as along as we don't find the end of the codeblock
		// the end is automatically consumed by consume_if
		while (!consume_if(expect)) {
			if (eof()) throw error("end of codeblock", "EOF");
			content += consume();
		}

		nomnom(); // slurp leftover whitespace after end_string

		return new Block.CodeBlock(content, code_params);
	}

	function try_link(): Inline.Link | undefined {
		const checkpoint = i;

		if (!consume_if("[")) return undefined;

		const content = inline("]", "[", "![") as Exclude<Inline, { type: "link" | "image" }>[];

		if (not("]")) {
			revert(checkpoint);
			return undefined;
		}

		consume(); // consume the closing bracket

		if (!consume_if("(")) {
			revert(checkpoint);
			return undefined;
		}

		let href = "";
		while (not(")", "\n")) href += consume();

		if (not(")")) {
			revert(checkpoint);
			return undefined;
		}

		consume(); // consume the closing parenthesis

		return new Inline.Link(content, href);
	}

	function try_image(): Inline.Image | undefined {
		const checkpoint = i;

		if (!consume_if("!")) return undefined;

		const link = try_link();
		if (link === undefined) {
			revert(checkpoint);
			return undefined;
		}

		return new Inline.Image(link.content, link.href);
	}

	function try_matching_inline(char: string): Inline[] | undefined {
		const checkpoint = i;

		if (!consume_if(char)) return undefined;

		const content = inline(char);

		if (content.length === 0 || not(char)) {
			revert(checkpoint);
			return undefined;
		}

		consume(); // consume the closing char

		return content;
	}

	function try_strong(): Inline.Strong | undefined {
		const content = try_matching_inline("*") as Exclude<Inline, Inline.Strong>[];
		if (content === undefined) return undefined;
		return new Inline.Strong(content);
	}

	function try_strike(): Inline.Strike | undefined {
		const content = try_matching_inline("~") as Exclude<Inline, Inline.Strike>[];
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
			if (eof()) {
				revert(checkpoint);
				return undefined;
			}
			content += consume();
		}

		if (not("`") || content.length === 0) {
			revert(checkpoint);
			return undefined;
		}

		consume(); // consume the closing backtick
		return new Inline.Code(content);
	}

	function try_variable_interpolation(): Inline.VariableInterpolation | undefined {
		const checkpoint = i;

		if (!consume_if("${")) return undefined;

		// TODO: support expressions
		let name = "";
		while (not("}", "\n")) {
			if (eof()) {
				revert(checkpoint);
				return undefined;
			}
			name += consume();
		}

		if (not("}")) {
			revert(checkpoint);
			return undefined;
		}

		consume(); // consume the closing brace
		return new Inline.VariableInterpolation(name);
	}

	function try_footnote_reference(): Inline.FootnoteReference | undefined {
		const checkpoint = i;

		if (!consume_if("[^")) return undefined;

		let reference = "";
		while (not("]", "\n")) {
			if (eof()) {
				revert(checkpoint);
				return undefined;
			}
			reference += consume();
		}

		if (not("]")) {
			revert(checkpoint);
			return undefined;
		}
		consume(); // consume the closing bracket

		return new Inline.FootnoteReference(reference);
	}

	function raw_text_until(...untilChar: string[]): Inline.Text {
		let buffer = "";
		while (not(...untilChar)) buffer += consume();
		return new Inline.Text(buffer);
	}

	function inline(...untilChar: string[]): Inline[] {
		const content: Inline[] = [];
		let buffer = "";

		const add = (chunk: Inline) => {
			if (buffer.length > 0) content.push(new Inline.Text(buffer));
			buffer = "";
			content.push(chunk);
		};

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

		return content;
	}

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
		// current inline list, if defined, we're in an inline context
		let inline_list: Inline[] = [];

		while (not("\n\n")) {
			if (eof()) break;
			const chunk = inline("\n");
			console.log({ chunk });
			if (not("\n\n")) {
				chunk.push(new Inline.Text("\n"));
				consume(); // consume single newline
			}
			inline_list.push(...chunk);
		}

		return new Block.Paragraph(inline_list);
	}

	function footnote() {
		let reference = "";
		while (not("]", "\n")) {
			if (eof()) throw error("]", "EOF");
			reference += consume();
		}

		if (not("]")) throw error("]", peek());
		consume(); // consume the closing bracket

		const content = inline("\n");
		return new Block.Footnote(reference, content);
	}

	function comment() {
		nomnom();
		const content = consume_until("\n");
		return new Block.Comment(content);
	}

	// [^1] decorators should be normalised after parsing

	return ast;
}

import { readFileSync } from "node:fs";

const log = limited_log(0);

let from = Number(Bun.argv[2]) || 0;
let to = Number(Bun.argv[3]) || from + 5;

log(
	parse(readFileSync("reference.hm", "utf-8"), "reference.hm")
		.blocks.slice(from, to)
		.map(b => b.type + ": ---\n" + b.toString())
		.join("\n---\n"),
);
