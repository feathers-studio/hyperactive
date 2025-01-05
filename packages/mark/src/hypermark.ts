import { Block, Inline, AST, type Value, Meta } from "./types.ts";

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

export function parse(input: string, filename?: string) {
	let ast = new AST([]);

	let i = 0;
	let line = 1;
	let column = 1;

	const error = (expected: string, found: string) => {
		const file = filename ?? ":";
		found = found.replace(/\n/g, "\\n");
		const message = `Expected "${expected}", found "${found}" at index ${i} (${file}:${line}:${column})`;
		return new ParseError(i, line, column, message, filename);
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

	let blocks: (Block | DecoratorEndMarker | DecoratorStartMarker)[] = ast.blocks;

	// master loop decides which block type to parse
	while (i < input.length) {
		const char = peek();

		switch (char) {
			case "<@":
				blocks.push(new DecoratorEndMarker());
				break;
			case "\\":
				blocks.push(para());
				break;
			case "\n":
				consume();
				continue;
			case "=": {
				const result = call();
				if (result instanceof Meta) {
					if (ast.blocks.length)
						throw new UnexpectedSyntax(
							i,
							line,
							column,
							"=meta() call. Meta can only be declared at the top of a document",
							filename,
						);
					else ast.meta = result;
				} else blocks.push(result);
				break;
			}
			case "@": {
				const result = decorator();
				blocks.push(result);
				// decorators should be normalised after parsing [^1]
				if (consume_if(">")) {
					nomnomnom();
					blocks.push(new DecoratorStartMarker());
				}
				break;
			}
			case "#":
				blocks.push(heading());
				break;
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

	function param(): Block.Parameter | undefined {
		const name = ident();
		if (!name) return undefined;

		nomnomnom();
		expect(":");
		nomnomnom();

		const value = param_value();
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
			const value = param_value();
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

	function inline(untilChar: string): Inline[] {
		let buffer = "";
		while (not(untilChar)) {
			// TODO: implement inline elements
			buffer += consume();
		}
		return [new Inline.Text(buffer)];
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
			if (not("\n\n")) {
				chunk.push(new Inline.Text("\n"));
				consume(); // consume single newline
			}
			inline_list.push(...chunk);
		}

		return new Block.Paragraph(inline_list);
	}

	// [^1] decorators should be normalised after parsing

	return ast;
}
