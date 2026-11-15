import { describe, it, expect } from "bun:test";
import { parse } from "./hypermark.ts";
import { expand, type Macro } from "./expand.ts";
import type { ParseError } from "./common.ts";
import { Block, Inline, type Position } from "./types.ts";

/** A node's position as `line:column-line:column`, and the source text it covers. */
function where(source: string, node: { position?: Position } | undefined) {
	const p = node?.position;
	if (!p) return undefined;
	return {
		span: `${p.start.line}:${p.start.column}-${p.end.line}:${p.end.column}`,
		text: source.slice(p.start.offset, p.end.offset),
	};
}

const blocks = (source: string) => parse(source).blocks;

describe("Positions", () => {
	describe("blocks", () => {
		it("place a heading and its text", () => {
			const source = "# Title";
			const [heading] = blocks(source) as Block.Heading[];
			expect(where(source, heading)).toEqual({ span: "1:1-1:8", text: "# Title" });
			expect(where(source, heading!.content[0])).toEqual({ span: "1:3-1:8", text: "Title" });
		});

		it("count lines through the file", () => {
			const source = "# One\n\nTwo\n\n# Three";
			expect(blocks(source).map(b => where(source, b)?.span)).toEqual(["1:1-1:6", "3:1-3:4", "5:1-5:8"]);
		});

		it("run a code block from its opening fence to its closing one", () => {
			const source = "```js\nx\n```\n\nAfter.";
			expect(where(source, blocks(source)[0])).toEqual({ span: "1:1-3:4", text: "```js\nx\n```" });
		});

		it("include a call's = and a decorator's @", () => {
			const source = '=code("a.ts")\n\n@style(color: "red")\nText';
			const [call, decorator] = blocks(source);
			expect(where(source, call)?.text).toBe('=code("a.ts")');
			expect(where(source, decorator)?.text).toBe('@style(color: "red")');
		});

		it("end a call before spaces trailing it", () => {
			const source = '=code("a.ts")   ';
			expect(where(source, blocks(source)[0])?.text).toBe('=code("a.ts")');
		});

		it("place each of composed decorators", () => {
			const source = '@style(size: 2) @align("center")\nText';
			const [style, align] = blocks(source);
			expect(where(source, style)?.text).toBe("@style(size: 2)");
			expect(where(source, align)?.text).toBe('@align("center")');
		});

		it("place =meta, though it leaves the blocks", () => {
			const source = '=meta(title: "x")\n\n# Body';
			expect(where(source, parse(source).meta)?.text).toBe('=meta(title: "x")');
		});

		it("include a footnote's [^ and a comment's --", () => {
			const source = "[^1]: Note.\n\n-- aside";
			const [footnote, comment] = blocks(source);
			expect(where(source, footnote)?.text).toBe("[^1]: Note.");
			expect(where(source, comment)?.text).toBe("-- aside");
		});

		it("end a rule before its newline", () => {
			const source = "---\nAfter.";
			expect(where(source, blocks(source)[0])).toEqual({ span: "1:1-1:4", text: "---" });
		});

		it("place a table, its rows and its cells", () => {
			const source = "| a | b |\n| c | d |";
			const [table] = blocks(source) as Block.Table[];
			expect(where(source, table)?.text).toBe(source);
			expect(where(source, table!.rows[1])?.text).toBe("| c | d |");
			expect(where(source, table!.rows[1]!.cells[0])).toEqual({ span: "2:3-2:5", text: "c " });
		});
	});

	describe("inline", () => {
		it("place formatting and the text around it", () => {
			const source = "Some *bold* text.";
			const [paragraph] = blocks(source) as Block.Paragraph[];
			expect(paragraph!.content.map(node => where(source, node)?.text)).toEqual(["Some ", "*bold*", " text."]);
		});

		it("place links and images", () => {
			const source = "See [the guide](guide.hm) and ![a bot](bot.png).";
			const [paragraph] = blocks(source) as Block.Paragraph[];
			const [, link, , image] = paragraph!.content;
			expect(where(source, link)?.text).toBe("[the guide](guide.hm)");
			expect(where(source, image)?.text).toBe("![a bot](bot.png)");
		});

		it("leave trimmed trailing spaces outside a text's position", () => {
			const source = "abc   ";
			const [paragraph] = blocks(source) as Block.Paragraph[];
			expect(where(source, paragraph!.content[0])).toEqual({ span: "1:1-1:4", text: "abc" });
		});

		it("cover an escape as written, not as read", () => {
			const source = "a\\*b";
			const [paragraph] = blocks(source) as Block.Paragraph[];
			const text = paragraph!.content[0] as Inline.Text;
			expect(text.content).toBe("a*b");
			expect(where(source, text)).toEqual({ span: "1:1-1:5", text: "a\\*b" });
		});
	});

	describe("inside quotes and list items", () => {
		// Both are parsed again from a copy with their `> ` or indentation stripped. Without
		// mapping back, everything inside them would be placed in the copy, not the file.

		it("place a quote's content past its >", () => {
			const source = "> Quoted *line*\n> second";
			const [quote] = blocks(source) as Block.Quote[];
			const paragraph = quote!.content[0] as Block.Paragraph;
			expect(where(source, quote)?.span).toBe("1:1-2:9");
			expect(where(source, paragraph)?.span).toBe("1:3-2:9");
			expect(where(source, paragraph.content[1])).toEqual({ span: "1:10-1:16", text: "*line*" });
			expect(where(source, paragraph.content.at(-1))).toEqual({ span: "2:3-2:9", text: "second" });
		});

		it("place a nested list's content past its indent", () => {
			const source = "- item\n  - nested *x*";
			const [list] = blocks(source) as Block.List[];
			const nested = list!.items[0]!.content[1] as Block.List;
			const paragraph = nested.items[0]!.content[0] as Block.Paragraph;
			expect(where(source, nested)).toEqual({ span: "2:3-2:15", text: "- nested *x*" });
			expect(where(source, paragraph.content[1])).toEqual({ span: "2:12-2:15", text: "*x*" });
		});

		it("map through a quote inside a list item", () => {
			const source = "- a\n\n  > quoted";
			const [list] = blocks(source) as Block.List[];
			const quote = list!.items[0]!.content[1] as Block.Quote;
			expect(where(source, quote)).toEqual({ span: "3:3-3:11", text: "> quoted" });
			expect(where(source, quote.content[0])).toEqual({ span: "3:5-3:11", text: "quoted" });
		});

		it("report a parse error inside a quote where it is in the file", () => {
			// Used to give the position in the stripped copy, under the filename `:quote:`.
			let error: ParseError | undefined;
			try {
				parse("Intro.\n\n> ```ts(x)\n> y", { filename: "page.hm" });
			} catch (caught) {
				error = caught as ParseError;
			}
			expect(error).toMatchObject({ line: 3, column: 8, index: 15, filename: "page.hm" });
		});
	});

	describe("text that is not what it starts like", () => {
		// Each of these consumed its first characters before finding out, and the paragraph
		// it fell back to started after them.

		it("keeps the = of a line that is not a call", () => {
			const source = "= !not a call";
			const [paragraph] = blocks(source) as Block.Paragraph[];
			expect(where(source, paragraph)?.text).toBe(source);
			expect((paragraph!.content[0] as Inline.Text).content).toBe(source);
		});

		it("keeps the @ of a line that is not a decorator, and adds no empty block", () => {
			const source = "@ !important";
			expect(blocks(source).map(b => b?.type)).toEqual(["paragraph"]);
			expect(where(source, blocks(source)[0])?.text).toBe(source);
		});

		it("keeps the [^ of a line that is not a footnote", () => {
			const source = "[^ not a footnote";
			const [paragraph] = blocks(source) as Block.Paragraph[];
			expect((paragraph!.content[0] as Inline.Text).content).toBe(source);
		});
	});

	describe("expansion", () => {
		const read = async () => undefined;

		it("points a problem at the call that caused it", async () => {
			const source = '# Guide\n\n=code("missing.ts")';
			const doc = parse(source);
			const [problem] = await expand(doc, { read });
			expect(where(source, problem)).toEqual({ span: "3:1-3:20", text: '=code("missing.ts")' });
		});

		it("places what a macro returns where its call was written", async () => {
			const source = "Intro.\n\n=rule";
			const rule: Macro = () => new Block.Rule();
			const doc = parse(source);
			await expand(doc, { read, macros: { rule } });
			expect(where(source, doc.blocks[1])?.text).toBe("=rule");
		});

		it("points a problem in a returned call at the call that returned it", async () => {
			const source = "=outer";
			const outer: Macro = () => new Block.Call("code", new Block.Parameters([]));
			const doc = parse(source);
			const [problem] = await expand(doc, { read, macros: { outer } });
			expect(problem!.message).toBe("`=code` needs a file");
			expect(where(source, problem)?.text).toBe("=outer");
		});
	});
});
