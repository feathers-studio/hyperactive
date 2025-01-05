import { Block, Inline, AST, type Value, Meta } from "./types.ts";

class ParseError extends Error {
	constructor(
		public index: number,
		public line: number,
		public column: number,
		expected: string,
		found: string,
		public filename?: string,
	) {
		const file = filename ?? ":";
		super(`Expected "${expected}", found "${found}" at index ${index} (${file}:${line}:${column})`);
		this.name = "ParseError";
	}
}

export function parse(input: string, filename?: string) {
	let ast = new AST([]);

	let i = 0;
	let line = 1;
	let column = 1;

	const error = (expected: string, found: string) => {
		return new ParseError(i, line, column, expected, found.replace(/\n/g, "\\n"), filename);
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
		if (typeof n === "string") n = n.length;
		const slice = input.slice(i, i + n);
		i += n;
		const newline_count = slice.split("\n").length - 1;
		line += newline_count;
		column = slice.length - slice.lastIndexOf("\n") - 1;
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

	function is_inline_whitespace() {
		return is(" ") || is("\t");
	}

	function is_whitespace() {
		return is_inline_whitespace() || is("\n");
	}

	function nomnom() {
		while (is_inline_whitespace()) consume();
	}

	function nomnomnom() {
		while (is_whitespace()) consume();
	}

	// master loop decides which block type to parse
	while (i < input.length) {
		const char = peek();

		switch (char) {
			case "\\":
				para();
				break;
			case "\n":
				consume();
				continue;
			case "=":
				call();
				break;
			// case "@":
			// 	decorator();
			// 	break;
			// case "#":
			// 	heading();
			// 	break;
			// case "!":
			// 	image();
			// 	break;
			// case "`":
			// 	if (peek(0, 3) === "```") codeblock();
			// 	break;
			// case "|":
			// 	table();
			// 	break;
			// case "[":
			// 	footnote();
			// 	break;
			default:
				// if (/^\s*[-*]/.test(peek(3))) list();
				// else if (/^\s*[0-9]\. /.test(peek(3))) ordered_list();
				// else
				para();
				break;
		}
	}

	function ident(): string | undefined {
		let buffer = "";
		if (is(/^[A-Za-z_]$/)) buffer += consume();
		while (is(/^[A-Za-z0-9_-]$/)) buffer += consume();
		return buffer.length > 0 ? buffer : undefined;
	}

	function param_string(): string | undefined {
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

	function param_number(): number | undefined {
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

	function param_null(): null | undefined {
		if (consume_if("null")) return null;
		return undefined;
	}

	function param_boolean(): boolean | undefined {
		if (consume_if("true")) return true;
		if (consume_if("false")) return false;
		return undefined;
	}

	function param_list(): Value[] | undefined {
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

			const value = param_value();
			if (value === undefined) break;
			params.push(value);

			first = false;
		}

		if (not("]")) throw error("]", peek());
		consume(); // consume the closing bracket
		return params;
	}

	function param_object(): { [key: string]: Value } | undefined {
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

			const value = param_value();
			// didn't find a value, could not parse an object
			if (value === undefined) throw error("value", peek());
			params[key] = value;
			first = false;
		}

		if (not("}")) throw error("}", peek());
		consume(); // consume the closing bracket
		return params;
	}

	function param_value(): Value | undefined {
		let value: Value | undefined;

		if ((value = param_string()) !== undefined) return value;
		if ((value = param_number()) !== undefined) return value;
		if ((value = param_null()) !== undefined) return value;
		if ((value = param_boolean()) !== undefined) return value;
		if ((value = param_list()) !== undefined) return value;
		if ((value = param_object()) !== undefined) return value;
		return undefined;
	}

	function param(): Block.Call.Parameter | undefined {
		const name = ident();
		if (!name) return undefined;

		nomnomnom();
		expect(":");
		nomnomnom();

		const value = param_value();
		if (value === undefined) throw error("value", peek());

		return new Block.Call.Parameter(name, value);
	}

	function callNotation(): Block.Call {
		consume();
		nomnom();

		const name = ident();
		if (!name) throw error("identifier", peek());
		nomnom();

		expect("(");

		const params = new Block.Call.Parameters([]);

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

		if (not(")")) throw error(")", peek());
		consume(); // consume the closing parenthesis

		return new Block.Call.Call(name, params);
	}

	function call() {
		const res = callNotation();
		if (res.name === "meta") ast.meta = new Meta(res.parameters);
		else ast.blocks.push(res);
	}

	function inline(untilChar: string): Inline[] {
		let buffer = "";
		while (not(untilChar)) {
			// TODO: implement inline elements
			buffer += consume();
		}
		return [new Inline.Text(buffer)];
	}

	// paragraph parser, typically ends when two newlines are encountered
	// or when a decorator or call or code block is encountered
	function para() {
		// current inline list, if defined, we're in an inline context
		let inline_list: Inline[] = [];

		// buffer for inline content
		let buffer = "";

		while (not("\n\n")) {
			if (eof()) break;
			const chunk = inline("\n");
			inline_list.push(...chunk);
			buffer += consume();
		}

		ast.blocks.push(new Block.Paragraph(inline_list));
	}

	return ast;
}

import { readFileSync } from "node:fs";

console.log(parse(readFileSync("reference.hm", "utf-8"), "reference.hm"));
