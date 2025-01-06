import { describe, it, expect } from "bun:test";
import { parse } from "./hypermark.ts";
import { Block, Inline } from "./types.ts";

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
