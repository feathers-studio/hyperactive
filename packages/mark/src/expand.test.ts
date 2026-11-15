import { describe, it, expect } from "bun:test";
import { parse } from "./hypermark.ts";
import { expand, type ExpandOptions, type Macro } from "./expand.ts";
import { Block, Inline } from "./types.ts";
import { without_positions } from "./testing.ts";

const BOT = [
	'import { Telegraf } from "telegraf";',
	"",
	"// #region launch",
	"bot.launch();",
	"// #endregion",
	"",
].join("\n");

/** A project in memory, recording every path it is asked for. */
function project(files: Record<string, string> = { "examples/first-bot.ts": BOT }) {
	const asked: string[] = [];
	const read = async (path: string) => {
		asked.push(path);
		return files[path];
	};
	return { asked, read };
}

/** Structure only, as in parser.test.ts; one test below checks where problems point. */
async function run(source: string, options: Partial<ExpandOptions> = {}) {
	const { asked, read } = project();
	const doc = parse(source);
	const problems = await expand(doc, { read, filename: "guide/intro.hm", ...options });
	return { doc: without_positions(doc), problems: without_positions(problems), asked };
}

const code = (block: Block | undefined) => block as Block.CodeBlock;

describe("expand", () => {
	describe("=code", () => {
		it("expands a link to a region into a code block", async () => {
			const { doc, problems } = await run('=code([first-bot.ts](../examples/first-bot.ts), region: "launch")');
			expect(problems).toEqual([]);
			expect(doc.blocks).toEqual([
				new Block.CodeBlock(
					"bot.launch();",
					{ language: "ts", title: "first-bot.ts" },
					{
						url: "../examples/first-bot.ts",
						path: "examples/first-bot.ts",
						region: "launch",
						text: BOT.trimEnd(),
						lines: { start: 3, end: 4 },
					},
				),
			]);
		});

		it("takes a plain string as well, titled with the path as written", async () => {
			const { doc, problems } = await run('=code("../examples/first-bot.ts", region: "launch")');
			expect(problems).toEqual([]);
			expect(code(doc.blocks[0]).content).toBe("bot.launch();");
			expect(code(doc.blocks[0]).options?.title).toBe("../examples/first-bot.ts");
		});

		it("takes the whole file without a region, markers removed", async () => {
			const { doc } = await run('=code("../examples/first-bot.ts")');
			expect(code(doc.blocks[0]).content).toBe('import { Telegraf } from "telegraf";\n\nbot.launch();');
			expect(code(doc.blocks[0]).source?.lines).toEqual({ start: 0, end: 5 });
		});

		it("lets title and lang override, and keeps every other parameter", async () => {
			const { doc } = await run('=code("../examples/first-bot.ts", title: "Launch", lang: "js", twoslash)');
			expect(code(doc.blocks[0]).options).toEqual({
				language: "js",
				title: "Launch",
				params: new Block.Parameters([new Block.Parameter("twoslash", true)]),
			});
		});

		it("takes a link's text without its formatting as the title", async () => {
			const { doc } = await run("=code([*first*-bot.ts](../examples/first-bot.ts))");
			expect(code(doc.blocks[0]).options?.title).toBe("first-bot.ts");
		});

		it("names the language for an extension that is not its own name", async () => {
			const files = { "a.mjs": "x", "b.yml": "x", "c.hm": "x", "Makefile": "x" };
			const { read } = project(files);
			const doc = parse('=code("a.mjs")\n\n=code("b.yml")\n\n=code("c.hm")\n\n=code("Makefile")');
			await expand(doc, { read });
			expect(doc.blocks.map(b => code(b).options?.language)).toEqual(["js", "yaml", "hypermark", ""]);
		});
	});

	describe("paths", () => {
		it("resolves a URL against the document's own path", async () => {
			const { asked } = await run('=code("../examples/first-bot.ts")');
			expect(asked).toEqual(["examples/first-bot.ts"]);
		});

		it("reads a URL starting with / from the project root", async () => {
			const { asked } = await run('=code("/examples/first-bot.ts")');
			expect(asked).toEqual(["examples/first-bot.ts"]);
		});

		it("never asks for a file above the project root", async () => {
			const { doc, problems, asked } = await run('=code("../../secret.txt")');
			expect(asked).toEqual([]);
			expect(problems[0]!.message).toBe("../../secret.txt is not a file in the project");
			// Still a code block: a hole is easier to diagnose than a missing element.
			expect(code(doc.blocks[0]).content).toBe("");
		});

		it("never asks for a URL with a scheme", async () => {
			const { asked, problems } = await run('=code("https://example.com/bot.ts")');
			expect(asked).toEqual([]);
			expect(problems).toHaveLength(1);
		});

		it("reads a file once however many calls quote it", async () => {
			const { asked } = await run(
				'=code("../examples/first-bot.ts")\n\n=code("../examples/first-bot.ts", region: "launch")',
			);
			expect(asked).toEqual(["examples/first-bot.ts"]);
		});
	});

	describe("problems", () => {
		it("reports a missing file and leaves an empty block", async () => {
			const { doc, problems } = await run('=code("../examples/missing.ts")');
			expect(problems).toEqual([{ message: "Cannot read examples/missing.ts" }]);
			expect(doc.blocks[0]?.type).toBe("code-block");
		});

		it("reports a missing region with the names the file has", async () => {
			const { problems } = await run('=code("../examples/first-bot.ts", region: "lunch")');
			expect(problems[0]).toMatchObject({
				message: 'examples/first-bot.ts has no region "lunch"',
				hint: 'Regions in this file: "launch"',
			});
		});

		it("reports a call with no file", async () => {
			expect((await run("=code(twoslash)")).problems[0]!.message).toBe("`=code` needs a file");
		});

		it("reports a region given as a flag", async () => {
			const { problems } = await run('=code("../examples/first-bot.ts", region)');
			expect(problems[0]!.message).toBe("`region` is a name");
		});
	});

	describe("macros", () => {
		const note: Macro = first => new Block.Paragraph([new Inline.Text(`Note: ${String(first)}`)]);

		it("leaves a call that names no macro for the renderer", async () => {
			const { doc, problems } = await run('=figure("a.png")');
			expect(problems).toEqual([]);
			expect(doc.blocks[0]?.type).toBe("call");
		});

		it("expands a site's own macro", async () => {
			const { doc } = await run('=note("careful")', { macros: { note } });
			expect(doc.blocks).toEqual([new Block.Paragraph([new Inline.Text("Note: careful")])]);
		});

		it("lets a site's macro replace one from std", async () => {
			const { doc, asked } = await run('=code("../examples/first-bot.ts")', { macros: { code: note } });
			expect(asked).toEqual([]);
			expect(doc.blocks[0]?.type).toBe("paragraph");
		});

		it("passes the unnamed value and the named ones as arguments", async () => {
			const seen: unknown[] = [];
			const spy: Macro = (first, named) => (seen.push(first, named), []);
			await run('=spy("x", a: 1, b)', { macros: { spy } });
			expect(seen).toEqual(["x", { a: 1, b: true }]);
		});

		it("splices in several blocks, or none", async () => {
			const two: Macro = () => [new Block.Rule(), new Block.Rule()];
			const none: Macro = () => [];
			const { doc } = await run("=two\n\n=none\n\n# After", { macros: { two, none } });
			expect(doc.blocks.map(b => b.type)).toEqual(["rule", "rule", "heading"]);
		});

		it("expands calls inside lists, quotes and decorators", async () => {
			// The decorator case could not be written before: no decorator held its block.
			const source = '- =note("in a list")\n\n> =note("in a quote")\n\n@style()\n=note("decorated")';
			const { doc } = await run(source, { macros: { note } });
			const [list, quote, decorator] = doc.blocks as [Block.List, Block.Quote, Block.Decorator];
			expect(list.items[0]!.content).toEqual([new Block.Paragraph([new Inline.Text("Note: in a list")])]);
			expect(quote.content).toEqual([new Block.Paragraph([new Inline.Text("Note: in a quote")])]);
			expect(decorator.blocks).toEqual([new Block.Paragraph([new Inline.Text("Note: decorated")])]);
		});

		it("expands what a macro returns", async () => {
			const outer: Macro = () => new Block.Call("note", new Block.Parameters([new Block.Parameter("__default", "inner")]));
			const { doc } = await run("=outer", { macros: { outer, note } });
			expect(doc.blocks).toEqual([new Block.Paragraph([new Inline.Text("Note: inner")])]);
		});

		it("stops a macro that returns its own call", async () => {
			const loop: Macro = (_first, _named, context) => context.call;
			const { doc, problems } = await run("=loop", { macros: { loop } });
			expect(doc.blocks[0]?.type).toBe("call");
			expect(problems[0]!.message).toBe("`loop` expands into itself too deeply");
		});

		it("keeps the call of a macro that throws, and reports it", async () => {
			const broken: Macro = () => {
				throw new Error("no idea");
			};
			const { doc, problems } = await run("=broken", { macros: { broken } });
			expect(doc.blocks[0]?.type).toBe("call");
			expect(problems).toEqual([{ message: "`broken` failed: no idea" }]);
		});

		it("does not take an Object.prototype member for a macro", async () => {
			const { doc, problems } = await run("=constructor\n\n=toString");
			expect(problems).toEqual([]);
			expect(doc.blocks.map(b => b.type)).toEqual(["call", "call"]);
		});

		it("keeps problems in document order, though calls run in parallel", async () => {
			const slow: Macro = async (first, _named, context) => {
				await Bun.sleep(first === "first" ? 20 : 0);
				context.report(String(first));
				return [];
			};
			const { problems } = await run('=slow("first")\n\n=slow("second")', { macros: { slow } });
			expect(problems.map(p => p.message)).toEqual(["first", "second"]);
		});
	});
});
