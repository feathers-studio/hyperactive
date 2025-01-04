import { describe, it, expect } from "bun:test";
import { Lexer } from "./lexer";

describe("Lexer", () => {
	describe("Call tokens", () => {
		it("tokenizes simple calls", () => {
			const lexer = new Lexer("=test()");
			const tokens = lexer.tokenize();

			expect(tokens.map(t => t.type)).toEqual(["CALL_START", "CALL_NAME", "PAREN_OPEN", "PAREN_CLOSE"]);
		});

		it("tokenizes call parameters with values", () => {
			const lexer = new Lexer('=test(name: "value", num: 123, flag: true, empty: null)');
			const tokens = lexer.tokenize();

			expect(tokens.map(t => t.type)).toEqual([
				"CALL_START",
				"CALL_NAME",
				"PAREN_OPEN",
				"IDENTIFIER",
				"COLON",
				"STRING",
				"COMMA",
				"IDENTIFIER",
				"COLON",
				"NUMBER",
				"COMMA",
				"IDENTIFIER",
				"COLON",
				"BOOLEAN",
				"COMMA",
				"IDENTIFIER",
				"COLON",
				"NULL",
				"PAREN_CLOSE",
			]);
		});

		it("tokenizes nested calls", () => {
			const lexer = new Lexer('=outer(inner: =inner(value: "test"))');
			const tokens = lexer.tokenize();

			expect(tokens.map(t => t.type)).toEqual([
				"CALL_START",
				"CALL_NAME",
				"PAREN_OPEN",
				"IDENTIFIER",
				"COLON",
				"CALL_START",
				"CALL_NAME",
				"PAREN_OPEN",
				"IDENTIFIER",
				"COLON",
				"STRING",
				"PAREN_CLOSE",
				"PAREN_CLOSE",
			]);
		});
	});

	describe("Value tokens", () => {
		it("keeps continuous text together", () => {
			const lexer = new Lexer("Item 1 2 3");
			const tokens = lexer.tokenize();

			expect(tokens.map(t => t.type)).toEqual(["TEXT"]);
			expect(tokens.map(t => t.value)).toEqual(["Item 1 2 3"]);
		});

		it("treats boolean and null as text when not in call context", () => {
			const lexer = new Lexer("true false null");
			const tokens = lexer.tokenize();

			expect(tokens.map(t => t.type)).toEqual(["TEXT"]);
			expect(tokens.map(t => t.value)).toEqual(["true false null"]);
		});

		it("preserves multiple spaces in text", () => {
			const lexer = new Lexer("Item    1");
			const tokens = lexer.tokenize();

			expect(tokens.map(t => t.type)).toEqual(["TEXT"]);
			expect(tokens.map(t => t.value)).toEqual(["Item    1"]);
		});

		it("treats quotes as regular text when not in call context", () => {
			const lexer = new Lexer("\"double\" 'single'");
			const tokens = lexer.tokenize();

			expect(tokens.map(t => t.type)).toEqual(["TEXT"]);
			expect(tokens.map(t => t.value)).toEqual(["\"double\" 'single'"]);
		});

		it("only parses strings in call parameters", () => {
			const lexer = new Lexer('=test(param: "value with \\"quotes\\"")');
			const tokens = lexer.tokenize();

			expect(tokens.map(t => t.type)).toEqual([
				"CALL_START",
				"CALL_NAME",
				"PAREN_OPEN",
				"IDENTIFIER",
				"COLON",
				"STRING",
				"PAREN_CLOSE",
			]);
			expect(tokens.find(t => t.type === "STRING")?.value).toEqual('value with "quotes"');
		});
	});

	describe("Block tokens", () => {
		it("tokenizes comments", () => {
			const lexer = new Lexer("-- This is a comment\n-- Another comment");
			const tokens = lexer.tokenize();

			expect(tokens.map(t => t.type)).toEqual(["COMMENT", "NEWLINE", "COMMENT"]);
			expect(tokens.map(t => t.value)).toEqual(["This is a comment", "\n", "Another comment"]);
		});

		it("tokenizes headings with numbers", () => {
			const lexer = new Lexer("# Heading 1\n## Section 2");
			const tokens = lexer.tokenize();

			expect(tokens.map(t => t.type)).toEqual(["HEADING", "TEXT", "NEWLINE", "HEADING", "TEXT"]);
			expect(tokens.map(t => t.value)).toEqual(["#", "Heading 1", "\n", "##", "Section 2"]);
		});

		it("tokenizes lists with numbers", () => {
			const lexer = new Lexer("* Item 1\n* [ ] Task 2\n* [x] Done 3");
			const tokens = lexer.tokenize();

			expect(tokens.map(t => t.type)).toEqual([
				"LIST_MARKER",
				"TEXT",
				"NEWLINE",
				"LIST_MARKER",
				"TASK_MARKER",
				"TEXT",
				"NEWLINE",
				"LIST_MARKER",
				"TASK_MARKER",
				"TEXT",
			]);
			expect(tokens.map(t => t.value)).toEqual(["*", "Item 1", "\n", "*", "[ ]", "Task 2", "\n", "*", "[x]", "Done 3"]);
		});
	});

	describe("Table tokens", () => {
		it("tokenizes tables", () => {
			const lexer = new Lexer("| Name | Age |\n| :-- | ---|\n| *John* | _25_ |\n| Jane | 30 |");
			const tokens = lexer.tokenize();

			expect(tokens.map(t => t.type)).toEqual([
				"PIPE",
				"TEXT",
				"PIPE",
				"TEXT",
				"PIPE",
				"NEWLINE",
				"PIPE",
				"ALIGN",
				"PIPE",
				"ALIGN",
				"PIPE",
				"NEWLINE",
				"PIPE",
				"WHITESPACE",
				"STRONG",
				"TEXT",
				"STRONG",
				"WHITESPACE",
				"PIPE",
				"WHITESPACE",
				"EMPHASIS",
				"TEXT",
				"EMPHASIS",
				"WHITESPACE",
				"PIPE",
				"NEWLINE",
				"PIPE",
				"TEXT",
				"PIPE",
				"TEXT",
				"PIPE",
			]);
		});
	});

	describe("Code group tokens", () => {
		it("tokenizes code groups", () => {
			const lexer = new Lexer("::: code\n```js\nconsole.log('Hello, world!');\n```\n:::");
			const tokens = lexer.tokenize();

			expect(tokens.map(t => t.type)).toEqual([
				"CODE_GROUP_START",
				"CODE_GROUP_NAME",
				"NEWLINE",
				"CODE_START",
				"CODE_LANG",
				"CODE_CONTENT",
				"CODE_END",
				"NEWLINE",
				"CODE_GROUP_END",
			]);
		});
	});

	describe("Inline tokens", () => {
		it("tokenizes emphasis and strong", () => {
			const lexer = new Lexer("_em_ *strong*");
			const tokens = lexer.tokenize();

			expect(tokens.map(t => t.type)).toEqual([
				"EMPHASIS",
				"TEXT",
				"EMPHASIS",
				"WHITESPACE",
				"STRONG",
				"TEXT",
				"STRONG",
			]);
		});

		it("tokenizes inline code", () => {
			const lexer = new Lexer("`code`");
			const tokens = lexer.tokenize();

			expect(tokens.map(t => t.type)).toEqual(["CODE_SINGLE", "TEXT", "CODE_SINGLE"]);
		});

		it("tokenizes links and images", () => {
			const lexer = new Lexer("[link](url) ![image](src)");
			const tokens = lexer.tokenize();

			expect(tokens.map(t => t.type)).toEqual([
				"LINK_TEXT_OPEN",
				"TEXT",
				"LINK_TEXT_CLOSE",
				"LINK_OPEN",
				"TEXT",
				"LINK_CLOSE",
				"IMAGE_OPEN",
				"TEXT",
				"LINK_TEXT_CLOSE",
				"LINK_OPEN",
				"TEXT",
				"LINK_CLOSE",
			]);
		});
	});

	describe("Edge cases", () => {
		it("handles empty input", () => {
			const lexer = new Lexer("");
			const tokens = lexer.tokenize();
			expect(tokens).toEqual([]);
		});

		it("handles whitespace", () => {
			const lexer = new Lexer("  \t  \n  ");
			const tokens = lexer.tokenize();
			expect(tokens.map(t => t.type)).toEqual(["NEWLINE"]);
		});

		it("handles multiple newlines", () => {
			const lexer = new Lexer("\n\n\n");
			const tokens = lexer.tokenize();
			expect(tokens.map(t => t.type)).toEqual(["NEWLINE", "NEWLINE", "NEWLINE"]);
		});
	});
});
