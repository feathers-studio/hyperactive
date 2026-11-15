import { describe, it, expect } from "bun:test";
import { parse as parse_source } from "./hypermark.ts";
import { Block, Inline, Meta } from "./types.ts";
import { without_positions } from "./testing.ts";

/** Structure only; positions are tested in positions.test.ts. */
const parse = (...args: Parameters<typeof parse_source>) => without_positions(parse_source(...args));

describe("Inline", () => {
	describe("Text", () => {
		it("parses plain text", () => {
			const ast = parse("Hello world");
			expect(ast.blocks[0]).toEqual(new Block.Paragraph([new Inline.Text("Hello world")]));
		});

		it("escapes special characters", () => {
			const ast = parse("\\* \\_ \\@ \\= \\[ \\` \\# \\- \\| \\< \\\\");
			expect(ast.blocks[0]).toEqual(
				new Block.Paragraph([new Inline.Text("* _ @ = [ ` # - | < \\")]),
			);
		});
	});

	describe("Emphasis", () => {
		it("parses italic text", () => {
			const ast = parse("_italic text_");
			expect(ast.blocks[0]).toEqual(
				new Block.Paragraph([new Inline.Emphasis([new Inline.Text("italic text")])]),
			);
		});

		it("allows nested formatting except emphasis", () => {
			const ast = parse("_italic *bold* text_");
			expect(ast.blocks[0]).toEqual(
				new Block.Paragraph([
					new Inline.Emphasis([
						new Inline.Text("italic "),
						new Inline.Strong([new Inline.Text("bold")]),
						new Inline.Text(" text"),
					]),
				]),
			);
		});

		it("parses as text if emphasis is not closed", () => {
			const ast = parse("_italic text");
			expect(ast.blocks[0]).toEqual(new Block.Paragraph([new Inline.Text("_italic text")]));
		});

		it("parses as text if emphasis marker is escaped", () => {
			const ast = parse("\\_italic text_");
			expect(ast.blocks[0]).toEqual(new Block.Paragraph([new Inline.Text("_italic text_")]));
		});
	});

	describe("Strong", () => {
		it("parses bold text", () => {
			const ast = parse("*bold text*");
			expect(ast.blocks[0]).toEqual(
				new Block.Paragraph([new Inline.Strong([new Inline.Text("bold text")])]),
			);
		});

		it("allows nested formatting except strong", () => {
			const ast = parse("*bold _italic_ text*");
			expect(ast.blocks[0]).toEqual(
				new Block.Paragraph([
					new Inline.Strong([
						new Inline.Text("bold "),
						new Inline.Emphasis([new Inline.Text("italic")]),
						new Inline.Text(" text"),
					]),
				]),
			);
		});

		it("parses as text if strong is not closed", () => {
			const ast = parse("*bold text");
			expect(ast.blocks[0]).toEqual(new Block.Paragraph([new Inline.Text("*bold text")]));
		});

		it("parses as text if strong marker is escaped", () => {
			const ast = parse("\\*bold text*");
			expect(ast.blocks[0]).toEqual(new Block.Paragraph([new Inline.Text("*bold text*")]));
		});
	});

	describe("Strike", () => {
		it("parses strikethrough text", () => {
			const ast = parse("~~struck text~~");
			expect(ast.blocks[0]).toEqual(
				new Block.Paragraph([new Inline.Strike([new Inline.Text("struck text")])]),
			);
		});

		it("parses as text if strike is not closed", () => {
			const ast = parse("~~struck text");
			expect(ast.blocks[0]).toEqual(new Block.Paragraph([new Inline.Text("~~struck text")]));
		});

		it("parses as text if strike marker is escaped", () => {
			const ast = parse("\\~~struck text~~");
			expect(ast.blocks[0]).toEqual(new Block.Paragraph([new Inline.Text("~~struck text~~")]));
		});
	});

	describe("Underline", () => {
		it("parses underlined text", () => {
			const ast = parse("__underlined text__");
			expect(ast.blocks[0]).toEqual(
				new Block.Paragraph([new Inline.Underline([new Inline.Text("underlined text")])]),
			);
		});

		it("parses as text if underline is not closed", () => {
			const ast = parse("__underlined text");
			expect(ast.blocks[0]).toEqual(new Block.Paragraph([new Inline.Text("__underlined text")]));
		});

		it("parses as text if underline marker is escaped", () => {
			const ast = parse("\\_\\_underlined text__");
			expect(ast.blocks[0]).toEqual(new Block.Paragraph([new Inline.Text("__underlined text__")]));
		});
	});

	describe("Code", () => {
		it("parses inline code", () => {
			const ast = parse("`code`");
			expect(ast.blocks[0]).toEqual(new Block.Paragraph([new Inline.Code("code")]));
		});

		it("preserves special characters in code", () => {
			const ast = parse("`* _ @ = [ ] # - |`");
			expect(ast.blocks[0]).toEqual(new Block.Paragraph([new Inline.Code("* _ @ = [ ] # - |")]));
		});

		it("parses as text if code is not closed", () => {
			const ast = parse("`code");
			expect(ast.blocks[0]).toEqual(new Block.Paragraph([new Inline.Text("`code")]));
		});

		it("parses as text if code marker is escaped", () => {
			const ast = parse("\\`code`");
			expect(ast.blocks[0]).toEqual(new Block.Paragraph([new Inline.Text("`code`")]));
		});
	});

	describe("Link", () => {
		it("parses links", () => {
			const ast = parse("[Hypermark Docs](https://example.com)");
			expect(ast.blocks[0]).toEqual(
				new Block.Paragraph([
					new Inline.Link([new Inline.Text("Hypermark Docs")], "https://example.com"),
				]),
			);
		});

		it("allows formatted text in link content", () => {
			const ast = parse("[*Bold* _italic_](https://example.com)");
			expect(ast.blocks[0]).toEqual(
				new Block.Paragraph([
					new Inline.Link(
						[
							new Inline.Strong([new Inline.Text("Bold")]),
							new Inline.Text(" "),
							new Inline.Emphasis([new Inline.Text("italic")]),
						],
						"https://example.com",
					),
				]),
			);
		});

		it("parses as text if link text is not closed", () => {
			const ast = parse("[link text");
			expect(ast.blocks[0]).toEqual(new Block.Paragraph([new Inline.Text("[link text")]));
		});

		it("parses as text if link URL is not closed", () => {
			const ast = parse("[link text](https://example.com");
			expect(ast.blocks[0]).toEqual(
				new Block.Paragraph([new Inline.Text("[link text](https://example.com")]),
			);
		});

		it("parses as text if link marker is escaped", () => {
			const ast = parse("\\[link text](https://example.com)");
			expect(ast.blocks[0]).toEqual(
				new Block.Paragraph([new Inline.Text("[link text](https://example.com)")]),
			);
		});
	});

	describe("Variable Interpolation", () => {
		it("parses variable interpolation", () => {
			const ast = parse("Hello ${name}!");
			expect(ast.blocks[0]).toEqual(
				new Block.Paragraph([
					new Inline.Text("Hello "),
					new Inline.VariableInterpolation("name"),
					new Inline.Text("!"),
				]),
			);
		});

		it("parses as text if interpolation is not closed", () => {
			const ast = parse("Hello ${name");
			expect(ast.blocks[0]).toEqual(new Block.Paragraph([new Inline.Text("Hello ${name")]));
		});

		it("parses as text if interpolation marker is escaped", () => {
			const ast = parse("Hello \\${name}");
			expect(ast.blocks[0]).toEqual(new Block.Paragraph([new Inline.Text("Hello ${name}")]));
		});
	});

	describe("Complex Nesting", () => {
		it("handles complex nested formatting", () => {
			const ast = parse("*bold _italic ~~struck `code`~~_*");
			expect(ast.blocks[0]).toEqual(
				new Block.Paragraph([
					new Inline.Strong([
						new Inline.Text("bold "),
						new Inline.Emphasis([
							new Inline.Text("italic "),
							new Inline.Strike([new Inline.Text("struck "), new Inline.Code("code")]),
						]),
					]),
				]),
			);
		});
	});
});

describe("Blocks", () => {
	describe("Paragraph", () => {
		it("parses a plaintext paragraph", () => {
			const ast = parse("Hello world");
			expect(ast.blocks[0]).toEqual(new Block.Paragraph([new Inline.Text("Hello world")]));
		});

		it("preserves single newlines within paragraphs", () => {
			const ast = parse("Hello\nworld");
			expect(ast.blocks[0]).toEqual(
				new Block.Paragraph([
					new Inline.Text("Hello"),
					new Inline.Text("\n"),
					new Inline.Text("world"),
				]),
			);
		});

		it("splits on double newlines", () => {
			const ast = parse("Hello\n\nworld");
			expect(ast.blocks).toEqual([
				new Block.Paragraph([new Inline.Text("Hello")]),
				new Block.Paragraph([new Inline.Text("world")]),
			]);
		});
	});

	describe("Heading", () => {
		it("parses headings of different levels", () => {
			const ast = parse("# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6");
			expect(ast.blocks).toEqual([
				new Block.Heading(1, [new Inline.Text("H1")]),
				new Block.Heading(2, [new Inline.Text("H2")]),
				new Block.Heading(3, [new Inline.Text("H3")]),
				new Block.Heading(4, [new Inline.Text("H4")]),
				new Block.Heading(5, [new Inline.Text("H5")]),
				new Block.Heading(6, [new Inline.Text("H6")]),
			]);
		});

		it("allows formatted text in headings", () => {
			const ast = parse("# Hello *bold* _italic_");
			expect(ast.blocks).toEqual([
				new Block.Heading(1, [
					new Inline.Text("Hello "),
					new Inline.Strong([new Inline.Text("bold")]),
					new Inline.Text(" "),
					new Inline.Emphasis([new Inline.Text("italic")]),
				]),
			]);
		});

		it("falls back to paragraph on invalid heading levels", () => {
			expect(parse("#######").blocks).toEqual([new Block.Paragraph([new Inline.Text("#######")])]);
		});

		it("requires a space or tab after the hashes", () => {
			expect(parse("#hashtag").blocks).toEqual([new Block.Paragraph([new Inline.Text("#hashtag")])]);
			expect(parse("#").blocks.map(b => b.type)).toEqual(["paragraph"]);
			expect(parse("#\tTitle").blocks).toEqual([new Block.Heading(1, [new Inline.Text("Title")])]);
		});
	});

	describe("Quote", () => {
		it("parses a simple quote", () => {
			const ast = parse("> Hello world");
			expect(ast.blocks).toEqual([
				new Block.Quote([new Block.Paragraph([new Inline.Text("Hello world")])]),
			]);
		});

		it("parses multi-line quotes", () => {
			const ast = parse("> Line 1\n> Line 2");
			expect(ast.blocks).toEqual([
				new Block.Quote([
					new Block.Paragraph([
						new Inline.Text("Line 1"),
						new Inline.Text("\n"),
						new Inline.Text("Line 2"),
					]),
				]),
			]);
		});

		it("parses nested quotes", () => {
			const ast = parse("> Outer\n>\n> > Inner");
			expect(ast.blocks).toEqual([
				new Block.Quote([
					new Block.Paragraph([new Inline.Text("Outer")]),
					new Block.Quote([new Block.Paragraph([new Inline.Text("Inner")])]),
				]),
			]);
		});
	});

	describe("Code Block", () => {
		const params = (...entries: [string, unknown][]) =>
			new Block.Parameters(entries.map(([name, value]) => new Block.Parameter(name, value as never)));

		it("parses a simple code block", () => {
			expect(parse("```js\nconst x = 1;\n```").blocks).toEqual([
				new Block.CodeBlock("const x = 1;", { language: "js" }),
			]);
		});

		it("parses a code block with no language", () => {
			expect(parse("```\nplain\n```").blocks).toEqual([new Block.CodeBlock("plain", { language: "" })]);
		});

		it("parses a title written as one word", () => {
			expect(parse("```js example.js\nconst x = 1;\n```").blocks).toEqual([
				new Block.CodeBlock("const x = 1;", { language: "js", title: "example.js" }),
			]);
		});

		it("parses a quoted title with spaces", () => {
			// A second bare word used to throw, so a title could not contain a space.
			expect(parse('```ts "the current way"\nx\n```').blocks).toEqual([
				new Block.CodeBlock("x", { language: "ts", title: "the current way" }),
			]);
		});

		it("parses parameters with the call grammar, flags included", () => {
			expect(parse('```ts (highlight: "2-3", line-numbers)\nx\n```').blocks).toEqual([
				new Block.CodeBlock("x", {
					language: "ts",
					params: params(["highlight", "2-3"], ["line-numbers", true]),
				}),
			]);
		});

		it("parses a title and parameters together", () => {
			expect(parse("```ts bot.ts (twoslash)\nx\n```").blocks).toEqual([
				new Block.CodeBlock("x", { language: "ts", title: "bot.ts", params: params(["twoslash", true]) }),
			]);
		});

		it("passes parameter names it does not know through", () => {
			const [block] = parse('```ts (region: "launch", anything-else: 1)\nx\n```').blocks as Block.CodeBlock[];
			expect(block.options?.params?.parameters.map(p => p.name)).toEqual(["region", "anything-else"]);
		});

		it("requires a space before the parameters", () => {
			// GitHub takes everything up to the first space as the language, so `ts(twoslash)`
			// would lose its highlighting there.
			expect(() => parse("```ts(twoslash)\nx\n```")).toThrow("a space before (");
			expect(() => parse("```ts bot.ts(twoslash)\nx\n```")).toThrow("a space before (");
		});

		it("keeps the parameters on the opening line", () => {
			// GitHub reads only the opening line as the info string. An unclosed `(` must not
			// run on and read the body as parameters.
			expect(() => parse("```ts (twoslash\nbot.launch();\n```")).toThrow(") on the same line");
		});

		it("rejects text after the parameters", () => {
			expect(() => parse("```ts (twoslash) extra\nx\n```")).toThrow("the end of the line");
		});

		it("is held by a longer fence", () => {
			// Replaces `:end=`, whose closer GitHub never recognised, so the rest of the
			// document was swallowed there.
			expect(parse("````md\n```js\ninner\n```\n````\n\nAfter.").blocks).toEqual([
				new Block.CodeBlock("```js\ninner\n```", { language: "md" }),
				new Block.Paragraph([new Inline.Text("After.")]),
			]);
		});

		it("closes on a longer fence, trailing spaces, or up to three spaces of indent", () => {
			for (const closer of ["`````", "```   ", "   ```"]) {
				expect(parse(`\`\`\`js\nx\n${closer}\n\nAfter.`).blocks.map(b => b.type)).toEqual([
					"code-block",
					"paragraph",
				]);
			}
		});

		it("treats a line of backticks followed by text as content", () => {
			expect(parse("```js\nx\n```END\ny\n```").blocks).toEqual([
				new Block.CodeBlock("x\n```END\ny", { language: "js" }),
			]);
		});

		it("parses an empty block without swallowing what follows", () => {
			// The rest of the document used to become the block's content.
			expect(parse("```js\n```\n\nAfter.").blocks).toEqual([
				new Block.CodeBlock("", { language: "js" }),
				new Block.Paragraph([new Inline.Text("After.")]),
			]);
		});

		it("parses an opening line at the end of the document", () => {
			// Used to hang forever: the info-string loops never stopped at the end of the input.
			// A regression would hang this test rather than fail it.
			expect(parse("```js").blocks).toEqual([new Block.CodeBlock("", { language: "js" })]);
			expect(parse("```js title").blocks).toEqual([new Block.CodeBlock("", { language: "js", title: "title" })]);
		});

		it("runs an unclosed block to the end of the document", () => {
			expect(parse("```js\ncode").blocks).toEqual([new Block.CodeBlock("code", { language: "js" })]);
			expect(parse("```js\ncode\n").blocks).toEqual([new Block.CodeBlock("code", { language: "js" })]);
		});

		it("is not a fence when the opening line holds a backtick, as in GFM", () => {
			expect(parse("```js `x`").blocks.map(b => b.type)).toEqual(["paragraph"]);
		});

		it("interrupts a paragraph", () => {
			expect(parse("Text\n```js\nx\n```").blocks.map(b => b.type)).toEqual(["paragraph", "code-block"]);
		});

		it("does not split a paragraph at a wrapped line that opens with inline code", () => {
			// Any backtick at the start of a line used to end the paragraph.
			expect(parse("Some text\n`code` continues.").blocks).toHaveLength(1);
		});

		it("round-trips through toString, fencing its own fences", () => {
			const source = [
				"````md \"a fence in a fence\" (line-numbers)",
				"```js",
				"inner",
				"```",
				"````",
			].join("\n");
			const [block] = parse(source).blocks as Block.CodeBlock[];
			expect(block.toString()).toBe(source);
			expect(parse(block.toString()).blocks).toEqual([block]);
		});
	});

	describe("Comment", () => {
		it("parses single-line comments", () => {
			const ast = parse("-- This is a comment");
			expect(ast.blocks).toEqual([new Block.Comment("This is a comment")]);
		});
	});

	describe("Table", () => {
		it("parses simple tables", () => {
			const ast = parse("|A|B|\n|C|D|");
			expect(ast.blocks).toEqual([
				new Block.Table([
					new Block.TableRow([
						new Block.TableCell([new Inline.Text("A")]),
						new Block.TableCell([new Inline.Text("B")]),
					]),
					new Block.TableRow([
						new Block.TableCell([new Inline.Text("C")]),
						new Block.TableCell([new Inline.Text("D")]),
					]),
				]),
			]);
		});

		it("parses tables with alignment", () => {
			const ast = parse("|A|B|\n|:--|--:|\n|C|D|");
			expect(ast.blocks).toEqual([
				new Block.Table(
					[
						new Block.TableRow([
							new Block.TableCell([new Inline.Text("C")]),
							new Block.TableCell([new Inline.Text("D")]),
						]),
					],
					new Block.TableRow([
						new Block.TableCell([new Inline.Text("A")]),
						new Block.TableCell([new Inline.Text("B")]),
					]),
					new Block.TableAlignmentRow(["left", "right"]),
				),
			]);
		});

		it("normalizes table cell counts", () => {
			const ast = parse("|A|B|C|\n|D|E|");
			expect(ast.blocks).toEqual([
				new Block.Table([
					new Block.TableRow([
						new Block.TableCell([new Inline.Text("A")]),
						new Block.TableCell([new Inline.Text("B")]),
						new Block.TableCell([new Inline.Text("C")]),
					]),
					new Block.TableRow([
						new Block.TableCell([new Inline.Text("D")]),
						new Block.TableCell([new Inline.Text("E")]),
						new Block.TableCell([]),
					]),
				]),
			]);
		});
	});

	describe("List", () => {
		const para = (text: string) => new Block.Paragraph([new Inline.Text(text)]);
		const item = (...content: Block[]) => new Block.ListItem(content);
		const task = (checked: boolean, text: string) => new Block.TaskItem([para(text)], checked);
		const list = (
			start_marker: string,
			items: (Block.ListItem | Block.TaskItem)[],
			ordered = /[0-9]/.test(start_marker),
		) =>
			new Block.List(items, {
				start_marker,
				ordered,
				has_tasks: items.some(i => i.type === "task-item"),
			});

		it("collects consecutive items into one list", () => {
			expect(parse("- a\n- b\n- c").blocks).toEqual([
				list("-", [item(para("a")), item(para("b")), item(para("c"))]),
			]);
		});

		it("accepts * as a bullet", () => {
			expect(parse("* a\n* b").blocks).toEqual([list("*", [item(para("a")), item(para("b"))])]);
		});

		it("parses ordered lists", () => {
			expect(parse("1. a\n2. b").blocks).toEqual([
				list("1.", [item(para("a")), item(para("b"))]),
			]);
		});

		it("keeps the start number of an ordered list", () => {
			const [block] = parse("3. a\n4. b").blocks;
			expect(block).toEqual(list("3.", [item(para("a")), item(para("b"))]));
		});

		it("parses task items, checked or not", () => {
			expect(parse("- [ ] todo\n- [x] done\n- [X] also done").blocks).toEqual([
				list("-", [task(false, "todo"), task(true, "done"), task(true, "also done")]),
			]);
		});

		it("marks a list holding any task item", () => {
			const [block] = parse("- plain\n- [ ] todo").blocks as Block.List[];
			expect(block.options?.has_tasks).toBe(true);
			expect(block.items[0]).toEqual(item(para("plain")));
		});

		it("nests a list indented to the content column", () => {
			expect(parse("- a\n  - nested\n  - nested too\n- b").blocks).toEqual([
				list("-", [
					item(para("a"), list("-", [item(para("nested")), item(para("nested too"))])),
					item(para("b")),
				]),
			]);
		});

		it("nests an ordered list inside an unordered one", () => {
			expect(parse("- a\n  1. one\n  2. two").blocks).toEqual([
				list("-", [item(para("a"), list("1.", [item(para("one")), item(para("two"))]))]),
			]);
		});

		it("measures the content column from the marker's own width", () => {
			// `10. ` is four columns wide, so a nested list needs four spaces, not three.
			expect(parse("10. a\n    - nested").blocks).toEqual([
				list("10.", [item(para("a"), list("-", [item(para("nested"))]))]),
			]);
		});

		it("keeps an indented paragraph after a blank line in the item", () => {
			expect(parse("- first\n\n  second\n- next").blocks).toEqual([
				list("-", [item(para("first"), para("second")), item(para("next"))]),
			]);
		});

		it("continues across a blank line between items, as GFM does", () => {
			expect(parse("- a\n\n- b").blocks).toEqual([list("-", [item(para("a")), item(para("b"))])]);
		});

		it("ends at a paragraph that is not indented", () => {
			expect(parse("- a\n- b\n\nAfter.").blocks).toEqual([
				list("-", [item(para("a")), item(para("b"))]),
				para("After."),
			]);
		});

		it("starts a new list when the bullet changes, as GFM does", () => {
			expect(parse("- a\n* b").blocks).toEqual([
				list("-", [item(para("a"))]),
				list("*", [item(para("b"))]),
			]);
		});

		it("starts a new list when switching between ordered and unordered", () => {
			expect(parse("- a\n1. b").blocks).toEqual([
				list("-", [item(para("a"))]),
				list("1.", [item(para("b"))]),
			]);
		});

		it("is separated from the next list by a comment", () => {
			expect(parse("- a\n-- split\n- b").blocks).toEqual([
				list("-", [item(para("a"))]),
				new Block.Comment("split"),
				list("-", [item(para("b"))]),
			]);
		});

		it("does not mistake a comment, a rule or strong text for an item", () => {
			expect(parse("-- note").blocks).toEqual([new Block.Comment("note")]);
			expect(parse("---\n").blocks).toEqual([new Block.Rule()]);
			expect(parse("*bold* start").blocks).toEqual([
				new Block.Paragraph([new Inline.Strong([new Inline.Text("bold")]), new Inline.Text(" start")]),
			]);
		});

		it("does not take a number without a space as a marker", () => {
			expect(parse("1.5 is a number").blocks).toEqual([para("1.5 is a number")]);
		});

		it("does not take a number of ten digits as a marker", () => {
			expect(parse("1234567890. text").blocks).toEqual([para("1234567890. text")]);
		});

		it("parses the reference's own Core Concepts list", () => {
			// Rendered as three empty lists and three paragraphs before ordered lists worked.
			const source = "1. *Content* - one\n2. *Decorators* - two\n3. *Extension Calls* - three";
			const [block, ...rest] = parse(source).blocks as Block.List[];
			expect(rest).toEqual([]);
			expect(block.options).toEqual({ start_marker: "1.", ordered: true, has_tasks: false });
			expect(block.items).toHaveLength(3);
		});

		it("round-trips through toString", () => {
			const source = [
				"- a",
				"  - nested",
				"- [x] done",
				"- b",
				"",
				"  more of b",
				"",
				"3. three",
				"4. four",
				"   1. inner",
			].join("\n");
			const blocks = parse(source).blocks;
			expect(parse(blocks.map(b => b.toString()).join("\n\n")).blocks).toEqual(blocks);
		});
	});

	describe("Paragraph interruption", () => {
		it("keeps a wrapped line that opens with a number in the paragraph", () => {
			// Any digit at the start of a line used to end the paragraph.
			expect(parse("The year was\n2024 and all was well.").blocks).toEqual([
				new Block.Paragraph([
					new Inline.Text("The year was"),
					new Inline.Text("\n"),
					new Inline.Text("2024 and all was well."),
				]),
			]);
		});

		it("keeps a wrapped line that opens with a number and a full stop", () => {
			// "2024. " looks like an ordered marker, but only a list starting at 1 may
			// interrupt a paragraph.
			expect(parse("It ended in\n2024. Then it began again.").blocks).toHaveLength(1);
		});

		it("is interrupted by an ordered list starting at 1", () => {
			expect(parse("Steps:\n1. first").blocks.map(b => b.type)).toEqual(["paragraph", "list"]);
		});

		it("is interrupted by a bulleted list", () => {
			expect(parse("Items:\n- a").blocks.map(b => b.type)).toEqual(["paragraph", "list"]);
			expect(parse("Items:\n* a").blocks.map(b => b.type)).toEqual(["paragraph", "list"]);
		});

		it("keeps a wrapped line that opens with a hyphenated word", () => {
			expect(parse("Temperatures of\n-5 degrees").blocks).toHaveLength(1);
		});

		it("is interrupted by a comment", () => {
			expect(parse("Text\n-- note").blocks.map(b => b.type)).toEqual(["paragraph", "comment"]);
		});

		it("keeps a wrapped line that opens with a link", () => {
			// Any `[` opening a line ended the paragraph; it was meant for footnote definitions.
			expect(parse("See\n[the guide](guide.hm) for more.").blocks).toHaveLength(1);
		});

		it("keeps a wrapped line that opens with a footnote reference", () => {
			expect(parse("Text\n[^1] is referenced here.").blocks).toHaveLength(1);
		});

		it("is interrupted by a footnote definition", () => {
			expect(parse("Text\n[^1]: A note.").blocks.map(b => b.type)).toEqual(["paragraph", "footnote"]);
		});

		it("keeps a wrapped line that opens with a #hashtag", () => {
			expect(parse("Tagged\n#hashtag here.").blocks).toHaveLength(1);
		});

		it("is interrupted by a heading", () => {
			expect(parse("Text\n## Heading").blocks.map(b => b.type)).toEqual(["paragraph", "heading"]);
		});
	});

	describe("Call", () => {
		const params = (entries: Record<string, unknown>) =>
			new Block.Parameters(
				Object.entries(entries).map(([name, value]) => new Block.Parameter(name, value as never)),
			);
		const call = (name: string, entries: Record<string, unknown> = {}) =>
			new Block.Call(name, params(entries));

		it("parses named parameters on one line", () => {
			expect(parse('=figure(src: "a.jpg", width: 500)').blocks).toEqual([
				call("figure", { src: "a.jpg", width: 500 }),
			]);
		});

		it("parses a call spanning lines without a trailing comma", () => {
			// Threw `Expected ","` before: `)` was looked for before skipping the newline.
			expect(parse('=figure(\n\tsrc: "a.jpg",\n\twidth: 500\n)').blocks).toEqual([
				call("figure", { src: "a.jpg", width: 500 }),
			]);
		});

		it("parses a call spanning lines with a trailing comma", () => {
			expect(parse('=figure(\n\tsrc: "a.jpg",\n\twidth: 500,\n)').blocks).toEqual([
				call("figure", { src: "a.jpg", width: 500 }),
			]);
		});

		it("parses an object parameter that closes on its own line", () => {
			// Became a paragraph before, printing the call as text with no error at all.
			expect(parse("=f(\n\toptions: {\n\t\ta: 1\n\t}\n)").blocks).toEqual([
				call("f", { options: { a: 1 } }),
			]);
		});

		it("parses a single unnamed value", () => {
			expect(parse('=warning("careful")').blocks).toEqual([call("warning", { __default: "careful" })]);
		});

		it("allows whitespace around a single value", () => {
			const expected = [call("warning", { __default: "careful" })];
			expect(parse('=warning( "careful" )').blocks).toEqual(expected);
			expect(parse('=warning(\n\t"careful"\n)').blocks).toEqual(expected);
			expect(parse('=warning(\n\t"careful",\n)').blocks).toEqual(expected);
		});

		it("parses parameter names that begin with a keyword", () => {
			// Each became a paragraph before: `null`, `true` or `false` was read off the
			// front of the name as a value, and the rest of the call failed to parse.
			expect(parse("=f(nullable: true)").blocks).toEqual([call("f", { nullable: true })]);
			expect(parse("=f(trueColor: 1)").blocks).toEqual([call("f", { trueColor: 1 })]);
			expect(parse("=f(falsey: null)").blocks).toEqual([call("f", { falsey: null })]);
		});

		it("reads a name without a value as a flag", () => {
			expect(parse("=code(twoslash)").blocks).toEqual([call("code", { twoslash: true })]);
		});

		it("reads a flag exactly as the same name set to true", () => {
			expect(parse("=f(a)").blocks).toEqual(parse("=f(a: true)").blocks);
		});

		it("mixes flags and named parameters in any order", () => {
			expect(parse('=f(line-numbers, title: "x", twoslash)').blocks).toEqual([
				call("f", { "line-numbers": true, "title": "x", "twoslash": true }),
			]);
		});

		it("reads flags spanning lines without a trailing comma", () => {
			expect(parse("=f(\n\tline-numbers,\n\ttwoslash\n)").blocks).toEqual([
				call("f", { "line-numbers": true, "twoslash": true }),
			]);
		});

		it("allows whitespace before commas and colons", () => {
			const expected = [call("f", { twoslash: true, n: 5 })];
			expect(parse("=f(twoslash , n :5)").blocks).toEqual(expected);
			expect(parse("=f( twoslash , n : 5 , )").blocks).toEqual(expected);
			expect(parse("=f(\n\ttwoslash ,\n\tn\n\t: 5\n)").blocks).toEqual(expected);
		});

		it("still reads true, false and null as values, not flags", () => {
			expect(parse("=f(true)").blocks).toEqual([call("f", { __default: true })]);
			expect(parse("=f(null)").blocks).toEqual([call("f", { __default: null })]);
		});

		it("reads a name that begins with a keyword as a flag", () => {
			expect(parse("=f(nullable)").blocks).toEqual([call("f", { nullable: true })]);
		});

		it("names a missing comma between flags", () => {
			expect(() => parse("=f(twoslash line-numbers)")).toThrow('Expected ","');
		});

		it("does not read a bare key in an object as a flag", () => {
			// Flags belong to call parameters. In an object, `{ sync }` would read to anyone
			// who knows JavaScript as shorthand for `{ sync: sync }`, not `{ sync: true }`.
			expect(() => parse("=f(options: { sync })")).toThrow('Expected ":"');
		});

		describe("link and image values", () => {
			const link = (text: string, url: string) => new Inline.Link([new Inline.Text(text)], url);
			const image = (alt: string, url: string) => new Inline.Image([new Inline.Text(alt)], url);

			it("parses a link as a value", () => {
				expect(parse("=code([first-bot.ts](../examples/first-bot.ts))").blocks).toEqual([
					call("code", { __default: link("first-bot.ts", "../examples/first-bot.ts") }),
				]);
			});

			it("parses an image as a value", () => {
				expect(parse("=figure(image: ![A bot greeting](greeting.png))").blocks).toEqual([
					call("figure", { image: image("A bot greeting", "greeting.png") }),
				]);
			});

			it("keeps formatting in a link's text", () => {
				const [block] = parse("=code([*first*.ts](first.ts))").blocks as Block.Call[];
				expect(block.parameters.parameters[0]!.value).toEqual(
					new Inline.Link([new Inline.Strong([new Inline.Text("first")]), new Inline.Text(".ts")], "first.ts"),
				);
			});

			it("parses links and images inside lists and objects", () => {
				expect(parse("=gallery([![a](1.png), ![b](2.png)])").blocks).toEqual([
					call("gallery", { __default: [image("a", "1.png"), image("b", "2.png")] }),
				]);
				expect(parse("=f(source: { file: [a.ts](a.ts) })").blocks).toEqual([
					call("f", { source: { file: link("a.ts", "a.ts") } }),
				]);
			});

			it("parses a link whose text would also read as a list", () => {
				// `[1]` alone is a list; only the `](` after it makes this a link.
				expect(parse("=pages(next: [2](page-2.md))").blocks).toEqual([
					call("pages", { next: link("2", "page-2.md") }),
				]);
			});

			it("still parses a bracketed list as a list", () => {
				// A link is tried first, since both open with `[`.
				expect(parse("=f(list: [1, 2])").blocks).toEqual([call("f", { list: [1, 2] })]);
			});

			it("shares one url field between links and images", () => {
				const [block] = parse("=f(a: [x](one.ts), b: ![y](two.png))").blocks as Block.Call[];
				const [a, b] = block.parameters.parameters.map(p => p.value as Inline.Link | Inline.Image);
				expect([a!.url, b!.url]).toEqual(["one.ts", "two.png"]);
			});

			it("round-trips through toString as Hypermark, not JSON", () => {
				const source = "=gallery([![a](1.png), ![b](2.png)], cover: [first.ts](first.ts), lazy)";
				const blocks = parse(source).blocks;
				expect(blocks[0]!.toString()).toBe(source);
				expect(parse(blocks[0]!.toString()).blocks).toEqual(blocks);
			});
		});

		it("takes named parameters after an unnamed first one", () => {
			expect(parse('=code([bot.ts](bot.ts), region: "launch", twoslash)').blocks).toEqual([
				call("code", {
					__default: new Inline.Link([new Inline.Text("bot.ts")], "bot.ts"),
					region: "launch",
					twoslash: true,
				}),
			]);
			expect(parse('=warning("careful", title: "Watch out")').blocks).toEqual([
				call("warning", { __default: "careful", title: "Watch out" }),
			]);
		});

		it("names a missing comma after the unnamed parameter", () => {
			// This became a paragraph, when nothing could follow an unnamed value.
			expect(() => parse('=f("a" b: 1)')).toThrow('Expected ","');
		});

		it("parses a keyword as a single unnamed value", () => {
			expect(parse("=f(true)").blocks).toEqual([call("f", { __default: true })]);
			expect(parse("=f(null)").blocks).toEqual([call("f", { __default: null })]);
		});

		it("parses a call with no parameters, with or without parentheses", () => {
			expect(parse("=toc").blocks).toEqual([call("toc")]);
			expect(parse("=toc()").blocks).toEqual([call("toc")]);
			expect(parse("=toc(\n)").blocks).toEqual([call("toc")]);
		});

		it("names a missing comma between parameters", () => {
			expect(() => parse("=f(a: 1 b: 2)")).toThrow('Expected ","');
		});

		it("falls back to a paragraph when a call is never closed", () => {
			expect(parse("=f(a: 1").blocks.map(b => b.type)).toEqual(["paragraph"]);
		});

		it("hoists =meta spanning lines into the document", () => {
			const doc = parse('=meta(\n\ttitle: "Reference",\n\tauthor: "Team"\n)\n\n# Body');
			expect(doc.meta).toEqual(new Meta(params({ title: "Reference", author: "Team" })));
			expect(doc.blocks.map(b => b.type)).toEqual(["heading"]);
		});
	});

	describe("Call grammar", () => {
		const types = (source: string) =>
			parse(source).blocks.map(b => ("name" in b ? `${b.type}:${b.name}` : b.type));
		const text = (source: string) => {
			const [block] = parse(source).blocks as Block.Paragraph[];
			return block!.content.map(c => (c as Inline.Text).content).join("");
		};

		it("does not start a name with a digit or a hyphen", () => {
			// `ident` used to read on after a first character that failed its check.
			expect(text("=5 is the answer")).toBe("=5 is the answer");
			expect(types("=-x()")).toEqual(["paragraph"]);
		});

		it("allows digits and hyphens after a name's first character", () => {
			expect(types("=my-call2()")).toEqual(["call:my-call2"]);
		});

		it("allows no space after = or @, nor before (", () => {
			expect(text("= not a call")).toBe("= not a call");
			expect(text("@ not a decorator")).toBe("@ not a decorator");
			expect(text('=figure ("a.png")')).toBe('=figure ("a.png")');
		});

		it("is text when anything else is on its line", () => {
			// The call was taken and the rest of the line split off into a paragraph.
			expect(text('=figure("a.png") A caption')).toBe('=figure("a.png") A caption');
			expect(types('@style(color: "red") and more\nText')).toEqual(["paragraph"]);
		});

		it("ignores spaces after a call, adding no empty paragraph", () => {
			expect(types('=figure("a.png")   ')).toEqual(["call:figure"]);
			expect(types('@style(color: "red")   \nText')).toEqual(["decorator:style", "paragraph"]);
		});

		it("composes decorators on one line", () => {
			// Documented in the reference; the second decorator and the block it decorated
			// used to become one paragraph.
			expect(types('@style(font-size: "20px") @align("center")\nText')).toEqual([
				"decorator:style",
				"decorator:align",
				"paragraph",
			]);
		});

		it("lets the last of composed decorators open a container", () => {
			expect(types("@tabs(sync) @wide>\nx\n<@")).toEqual([
				"decorator:tabs",
				"decorator:wide",
				"decorator-start",
				"paragraph",
				"decorator-end",
			]);
		});

		it("keeps a wrapped line that opens with @ or = in the paragraph", () => {
			// `Contact\n@support` made a decorator named `support`.
			expect(types("Contact\n@support for help.")).toEqual(["paragraph"]);
			expect(types("Talk to\n=5 for help.")).toEqual(["paragraph"]);
		});

		it("still lets a call or decorator alone on the next line interrupt a paragraph", () => {
			expect(types("Text\n=toc()")).toEqual(["paragraph", "call:toc"]);
			expect(types('Text\n@style(color: "red")\nMore')).toEqual([
				"paragraph",
				"decorator:style",
				"paragraph",
			]);
		});

		it("requires (…) or > on a decorator, so a bare @name is text", () => {
			// Telegraf's docs mention @BotFather constantly; a list of usernames was a list of decorators.
			expect(types("@BotFather")).toEqual(["paragraph"]);
			expect(text("@BotFather")).toBe("@BotFather");
			const [list] = parse("- @BotFather\n- @userinfobot").blocks as Block.List[];
			expect(list!.items.map(item => item.content[0]?.type)).toEqual(["paragraph", "paragraph"]);
		});

		it("still takes a decorator with empty parentheses, or one opening a container", () => {
			expect(types("@centered()\nText")).toEqual(["decorator:centered", "paragraph"]);
			expect(types("@tabs>\nx\n<@")[0]).toBe("decorator:tabs");
		});

		it("ends a paragraph at a container's closer", () => {
			// `x\n<@` used to read the closer as the paragraph's last line.
			expect(types("@tabs>\nx\n<@")).toEqual(["decorator:tabs", "decorator-start", "paragraph", "decorator-end"]);
		});
	});

	describe("Decorator", () => {
		it("parses a decorator spanning lines without a trailing comma", () => {
			const [decorator, block] = parse('@style(\n\tcolor: "blue"\n)\nBlue text.').blocks;
			expect(decorator).toEqual(
				new Block.Decorator("style", new Block.Parameters([new Block.Parameter("color", "blue")]), []),
			);
			expect(block).toEqual(new Block.Paragraph([new Inline.Text("Blue text.")]));
		});

		it("takes flags", () => {
			const [decorator] = parse("@tabs(sync)>\n@named(\"a\")\nText\n<@").blocks;
			expect(decorator).toEqual(
				new Block.Decorator("tabs", new Block.Parameters([new Block.Parameter("sync", true)]), []),
			);
		});
	});

	describe("Footnote", () => {
		it("parses footnotes", () => {
			const ast = parse("Reference [^1]\n[^1]: Content");
			expect(ast.blocks).toEqual([
				new Block.Paragraph([
					//
					new Inline.Text("Reference "),
					new Inline.FootnoteReference("1"),
				]),
				new Block.Footnote("1", [new Inline.Text("Content")]),
			]);
		});
	});
});
