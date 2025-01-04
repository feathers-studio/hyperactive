import { describe, it, expect } from "bun:test";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Call } from "./types";
import { Block } from "./types";
import { Inline } from "./types";

describe("Parser", () => {
	// Helper function to parse input
	function parse(input: string) {
		const lexer = new Lexer(input);
		const tokens = lexer.tokenize();
		const parser = new Parser(tokens);
		return parser.parse();
	}

	describe("Call expressions", () => {
		it("parses empty calls", () => {
			const result = parse("=test()");
			expect(result).toEqual([new Call.Call("test", new Call.Parameters([]))]);
		});

		it("parses calls with single parameter", () => {
			const result = parse('=test(name: "value")');
			expect(result).toEqual([new Call.Call("test", new Call.Parameters([new Call.Parameter("name", "value")]))]);
		});

		it("parses calls with multiple parameters", () => {
			const result = parse('=figure(src: "image.jpg", width: 100, visible: true, data: null)');
			expect(result).toEqual([
				new Call.Call(
					"figure",
					new Call.Parameters([
						new Call.Parameter("src", "image.jpg"),
						new Call.Parameter("width", 100),
						new Call.Parameter("visible", true),
						new Call.Parameter("data", null),
					]),
				),
			]);
		});

		it("parses nested calls", () => {
			const result = parse('=outer(inner: =inner(value: "test"))');
			expect(result).toEqual([
				new Call.Call(
					"outer",
					new Call.Parameters([
						new Call.Parameter(
							"inner",
							new Call.Call("inner", new Call.Parameters([new Call.Parameter("value", "test")])),
						),
					]),
				),
			]);
		});

		it("throws on invalid call syntax", () => {
			expect(() => parse("=test(")).toThrow();
			expect(() => parse("=test name: 'value'")).toThrow();
			expect(() => parse("=test(name -> 'value')")).toThrow();
		});
	});

	describe("Block expressions", () => {
		it("parses headings", () => {
			const result = parse("# Heading 1\n## Subheading");
			expect(result).toEqual([
				new Block.Heading(1, [new Inline.Text("Heading 1")]),
				new Block.Heading(2, [new Inline.Text("Subheading")]),
			]);
		});

		it("parses lists", () => {
			const result = parse("* Item 1\n* [ ] Task 2\n* [x] Done 3");
			expect(result).toEqual([
				new Block.List(false, [
					new Block.ListItem([new Block.Paragraph([new Inline.Text("Item 1")])]),
					new Block.TaskItem([new Block.Paragraph([new Inline.Text("Task 2")])], false),
					new Block.TaskItem([new Block.Paragraph([new Inline.Text("Done 3")])], true),
				]),
			]);
		});

		it("parses code blocks", () => {
			const result = parse("```typescript\nconst x = 1;\n```");
			expect(result).toEqual([
				new Block.CodeBlock("const x = 1;", { language: "typescript", title: "", lineNumbers: false, highlight: [] }),
			]);
		});

		it("parses code blocks with options", () => {
			const result = parse("```typescript Title :line-numbers :highlight=1,3-5\ncode\n```");
			expect(result).toEqual([
				new Block.CodeBlock("code", {
					language: "typescript",
					title: "Title",
					lineNumbers: true,
					highlight: [
						{ start: 1, end: 1 },
						{ start: 3, end: 5 },
					],
				}),
			]);
		});

		it("parses quotes", () => {
			const result = parse("> Quote\n> Second line");
			expect(result).toEqual([
				new Block.Quote([
					new Block.Paragraph([new Inline.Text("Quote")]),
					new Block.Paragraph([new Inline.Text("Second line")]),
				]),
			]);
		});

		it("parses code groups", () => {
			const result = parse(
				//
				"::: code\n" +
					//
					"```js\n" +
					"console.log('Hello, world!');\n" +
					"```\n" +
					//
					"```python\n" +
					"print('Hello, world!');\n" +
					"```\n" +
					":::",
			);
			expect(result).toEqual([
				new Block.CodeGroup("code", [
					new Block.CodeBlock("console.log('Hello, world!');", {
						language: "js",
						title: "",
						lineNumbers: false,
						highlight: [],
					}),
				]),
			]);
		});

		it("parses tables", () => {
			const result = parse(
				`
| Header 1 | Header 2 |
| :-- | --: |
| Cell 1 | Cell 2 |
| Cell 3 | Cell 4 |
`.trim(),
			);
			expect(result).toEqual([
				new Block.Table(
					[
						new Block.TableRow([
							new Block.TableCell([new Inline.Text("Cell 1")]),
							new Block.TableCell([new Inline.Text("Cell 2")]),
						]),
						new Block.TableRow([
							new Block.TableCell([new Inline.Text("Cell 3")]),
							new Block.TableCell([new Inline.Text("Cell 4")]),
						]),
					],
					new Block.TableRow([new Block.TableCell([new Inline.Text("Header 1"), new Inline.Text("Header 2")])]),
					["left", "right"],
				),
			]);
		});
	});

	describe("Inline expressions", () => {
		it("parses emphasis and strong", () => {
			const result = parse("_emphasized_ and *strong*");
			expect(result).toEqual([
				new Block.Paragraph([
					new Inline.Emphasis([new Inline.Text("emphasized")]),
					new Inline.Text("and"),
					new Inline.Strong([new Inline.Text("strong")]),
				]),
			]);
		});

		it("parses links and images", () => {
			const result = parse("[Link](url) and ![Image](src)");
			expect(result).toEqual([
				new Block.Paragraph([
					new Inline.Link([new Inline.Text("Link")], "url"),
					new Inline.Text("and"),
					new Inline.Image("src", "Image"),
				]),
			]);
		});

		it("parses footnotes", () => {
			const result = parse("Text[^1] and [^1]: Footnote");
			expect(result).toEqual([
				new Block.Paragraph([new Inline.Text("Text"), new Inline.FootnoteReference("1"), new Inline.Text("and")]),
				new Block.Footnote("1", [new Inline.Text("Footnote")]),
			]);
		});
	});
});
