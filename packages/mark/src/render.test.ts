import { describe, it, expect } from "bun:test";
import { h, renderHTML } from "@hyperactive/hyper";
import { parse } from "./hypermark.ts";
import { render, type Component, type RenderOptions } from "./render.ts";
import { slugger } from "./slug.ts";

/** The HTML a document renders to, and its problems' messages. */
function html(source: string, options?: RenderOptions) {
	const { nodes, problems } = render(parse(source), options);
	return { html: nodes.map(renderHTML).join(""), problems: problems.map(p => p.message) };
}

describe("render", () => {
	describe("inline nodes", () => {
		it("renders strong, emphasis, strike and code as GitHub does", () => {
			expect(html("Some *strong*, _em_, ~del~ and `code`.").html).toBe(
				"<p>Some <strong>strong</strong>, <em>em</em>, <del>del</del> and <code>code</code>.</p>",
			);
		});

		it("escapes text and attribute values", () => {
			expect(html('A <b> and [x](a"b)').html).toBe('<p>A &lt;b&gt; and <a href="a&quot;b">x</a></p>');
		});

		it("renders links and images, with the image's text as its alt", () => {
			expect(html("[a *b*](https://x.test/) ![the *logo*](./logo.png)").html).toBe(
				'<p><a href="https://x.test/">a <strong>b</strong></a> <img src="./logo.png" alt="the logo" /></p>',
			);
		});

		it("renders an interpolation as its source, and reports it", () => {
			const result = html("Hello ${name}.");
			expect(result.html).toBe("<p>Hello ${name}.</p>");
			expect(result.problems).toEqual(["`${name}` has no value"]);
			// What the problem's hint suggests.
			expect(html("Hello \\${name}.")).toEqual({ html: "<p>Hello ${name}.</p>", problems: [] });
		});
	});

	describe("unsafe URLs", () => {
		it("renders a script link as its text, and reports it", () => {
			const result = html("[click](javascript:run) [x](VBScript:run)");
			expect(result.html).toBe("<p>click x</p>");
			expect(result.problems).toEqual(["`javascript:` links are not rendered", "`vbscript:` links are not rendered"]);
		});

		it("finds the scheme as a browser does, past leading spaces and through tabs", () => {
			expect(html("[x](java\tscript:run)").html).toBe("<p>x</p>");
			expect(html("[x](\x01 javascript:run)").problems).toEqual(["`javascript:` links are not rendered"]);
		});

		it("renders a data image as its alt text, and reports it", () => {
			const result = html("![a pixel](data:image/png;base64,AAAA)");
			expect(result.html).toBe("<p>a pixel</p>");
			expect(result.problems).toEqual(["`data:` images are not rendered"]);
		});

		it("keeps relative, fragment, mailto and https URLs", () => {
			expect(html("[a](./x) [b](#y) [c](mailto:a@x.test) [d](https://x.test/javascript:)").problems).toEqual([]);
		});
	});

	describe("headings", () => {
		it("takes GitHub's slugs as ids, numbering a repeat", () => {
			expect(html("# Hello, World!\n\n## Hello, World!\n\n### Über `code` café").html).toBe(
				[
					'<h1 id="hello-world">Hello, World!</h1>',
					'<h2 id="hello-world-1">Hello, World!</h2>',
					'<h3 id="über-code-café">Über <code>code</code> café</h3>',
				].join(""),
			);
		});

		it("leaves images and footnote references out of the id", () => {
			expect(html("## ![logo](./x.png) Title[^1]\n\n[^1]: Note.").html).toStartWith('<h2 id="-title">');
		});
	});

	describe("slugger", () => {
		it("counts repeats as github-slugger does", () => {
			const slug = slugger();
			expect(["a", "a", "a-1", "A", "a b", "a  b", "a—b ✓"].map(slug)).toEqual([
				"a",
				"a-1",
				"a-1-1",
				"a-2",
				"a-b",
				"a--b",
				"ab-",
			]);
		});
	});

	describe("lists", () => {
		it("renders a tight list's paragraphs as their text", () => {
			expect(html("- a\n- b").html).toBe("<ul><li>a</li><li>b</li></ul>");
		});

		it("renders a list loose when a blank line separates two items", () => {
			expect(html("- a\n\n- b").html).toBe("<ul><li><p>a</p></li><li><p>b</p></li></ul>");
		});

		it("renders a list loose when a blank line separates two blocks of an item", () => {
			expect(html("- a\n\n  more\n- b").html).toBe("<ul><li><p>a</p><p>more</p></li><li><p>b</p></li></ul>");
		});

		it("keeps a list tight around a nested list", () => {
			expect(html("- a\n  - b\n- c").html).toBe("<ul><li>a<ul><li>b</li></ul></li><li>c</li></ul>");
		});

		it("writes an ordered list's start, unless it is 1", () => {
			expect(html("3. a\n4. b").html).toBe('<ol start="3"><li>a</li><li>b</li></ol>');
			expect(html("1. a\n2. b").html).toBe("<ol><li>a</li><li>b</li></ol>");
		});

		it("renders tasks as GitHub does, with a disabled checkbox", () => {
			expect(html("- [ ] a\n- [x] b").html).toBe(
				[
					'<ul class="contains-task-list">',
					'<li class="task-list-item"><input type="checkbox" disabled /> a</li>',
					'<li class="task-list-item"><input type="checkbox" disabled checked /> b</li>',
					"</ul>",
				].join(""),
			);
		});

		it("puts a loose task's checkbox inside its first paragraph", () => {
			expect(html("- [x] a\n\n- [ ] b").html).toContain(
				'<li class="task-list-item"><p><input type="checkbox" disabled checked /> a</p></li>',
			);
		});

		it("renders a label in a plain list as a span before the item's text", () => {
			expect(html("- [npm]\n  npm install\n- [bun]\n  bun add").html).toBe(
				[
					"<ul>",
					'<li><span class="item-label">npm</span> npm install</li>',
					'<li><span class="item-label">bun</span> bun add</li>',
					"</ul>",
				].join(""),
			);
		});

		it("renders a list loose when a blank line follows a label", () => {
			expect(html("- [npm]\n\n  npm install").html).toBe(
				'<ul><li><span class="item-label">npm</span><p>npm install</p></li></ul>',
			);
		});
	});

	describe("other blocks", () => {
		it("renders a code block focusable, with its language as a class", () => {
			expect(html("```ts\nconst a = 1 < 2;\n```").html).toBe(
				'<pre tabindex="0"><code class="language-ts">const a = 1 &lt; 2;</code></pre>',
			);
			expect(html("```\nplain\n```").html).toBe('<pre tabindex="0"><code>plain</code></pre>');
		});

		it("renders a titled code block in a figure", () => {
			expect(html("```ts bot.ts (twoslash)\nx\n```").html).toBe(
				'<figure><figcaption>bot.ts</figcaption><pre tabindex="0"><code class="language-ts">x</code></pre></figure>',
			);
		});

		it("renders quotes and rules", () => {
			expect(html("> a\n> > b\n\n---\n\nc").html).toBe(
				"<blockquote><p>a</p><blockquote><p>b</p></blockquote></blockquote><hr /><p>c</p>",
			);
		});

		it("renders a table, aligning only the columns given an alignment", () => {
			const align = (value: string) => ` style="text-align: ${value}"`;
			expect(html("| a | b | c | d |\n| --- | :-- | :-: | --: |\n| 1 | 2 | 3 | 4 |").html).toBe(
				[
					"<table>",
					`<thead><tr><th>a</th><th${align("left")}>b</th><th${align("center")}>c</th><th${align("right")}>d</th></tr></thead>`,
					`<tbody><tr><td>1</td><td${align("left")}>2</td><td${align("center")}>3</td><td${align("right")}>4</td></tr></tbody>`,
					"</table>",
				].join(""),
			);
		});

		it("renders comments and =meta as nothing", () => {
			expect(html('=meta(title: "A")\n\n-- a note\n\nText').html).toBe("<p>Text</p>");
		});
	});

	describe("footnotes", () => {
		const source = ["One[^b], two[^a], three[^b].", "", "[^a]: A.", "[^b]: B."].join("\n");

		it("numbers references in the order of first use", () => {
			expect(html(source).html).toStartWith(
				[
					"<p>One",
					'<sup><a href="#fn-b" id="fnref-b" data-footnote-ref aria-describedby="footnote-label">1</a></sup>, two',
					'<sup><a href="#fn-a" id="fnref-a" data-footnote-ref aria-describedby="footnote-label">2</a></sup>, three',
					'<sup><a href="#fn-b" id="fnref-b-2" data-footnote-ref aria-describedby="footnote-label">1</a></sup>.',
					"</p>",
				].join(""),
			);
		});

		it("renders the footnotes last, linking back to every reference", () => {
			const back = (href: string, label: string) =>
				`<a href="#${href}" data-footnote-backref class="data-footnote-backref" aria-label="Back to reference ${label}">`;
			expect(html(source).html).toEndWith(
				[
					'<section class="footnotes" data-footnotes>',
					'<h2 id="footnote-label" class="sr-only">Footnotes</h2>',
					"<ol>",
					`<li id="fn-b"><p>B. ${back("fnref-b", "1")}↩</a> ${back("fnref-b-2", "1-2")}↩<sup>2</sup></a></p></li>`,
					`<li id="fn-a"><p>A. ${back("fnref-a", "2")}↩</a></p></li>`,
					"</ol>",
					"</section>",
				].join(""),
			);
		});

		it("renders a footnote defined in a quote", () => {
			const result = html("> Text[^q].\n>\n> [^q]: In a quote.");
			expect(result.problems).toEqual([]);
			expect(result.html).toContain('<li id="fn-q"><p>In a quote. ');
		});

		it("leaves out a footnote that is never referenced", () => {
			expect(html("Text.\n\n[^a]: A.").html).toBe("<p>Text.</p>");
		});

		it("renders a reference to a missing footnote as its source, and reports it", () => {
			const result = html("Text[^x] and[^constructor].");
			expect(result.html).toBe("<p>Text[^x] and[^constructor].</p>");
			expect(result.problems).toEqual(["No footnote is called `x`", "No footnote is called `constructor`"]);
		});

		it("encodes a reference with spaces in its link", () => {
			expect(html("A[^my note].\n\n[^my note]: B.").html).toContain('href="#fn-my-note" id="fnref-my-note"');
			expect(html("A[^ü].\n\n[^ü]: B.").html).toContain('href="#fn-%C3%BC" id="fnref-ü"');
		});
	});

	describe("components", () => {
		it("renders a call with no component as its source text, and reports where it is", () => {
			const { nodes, problems } = render(parse("Text\n\n=tabs(sync)"));
			expect(nodes.map(renderHTML).join("")).toBe("<p>Text</p><p>=tabs(sync)</p>");
			expect(problems).toEqual([
				{
					message: "No macro or component is called `tabs`",
					hint: "The call renders as its source text.",
					position: expect.objectContaining({ start: { line: 3, column: 1, offset: 6 } }),
				},
			]);
		});

		it("renders a decorated block without a missing component, and reports it", () => {
			const result = html("@note()\nText");
			expect(result.html).toBe("<p>Text</p>");
			expect(result.problems).toEqual(["No component is called `note`"]);
		});

		it("passes a call's parameters as a macro takes them", () => {
			const seen: unknown[] = [];
			const badge: Component = (first, named) => {
				seen.push(first, named);
				return h("span", {}, String(first));
			};
			expect(html('=badge("new", tone: "info", round)', { components: { badge } }).html).toBe(
				"<span>new</span>",
			);
			expect(seen).toEqual(["new", { tone: "info", round: true }]);
		});

		it("lets a decorator render what it decorates", () => {
			const aside: Component = (_first, _named, { node, render }) =>
				h("aside", {}, ...render(node.type === "decorator" ? node.blocks : []));
			expect(html("@aside()\n> *Note*", { components: { aside } }).html).toBe(
				"<aside><blockquote><p><strong>Note</strong></p></blockquote></aside>",
			);
		});

		it("spreads an array a component returns, so no `<!---->` markers appear", () => {
			const pair: Component = () => [h("p", {}, "a"), [h("p", {}, "b")]];
			expect(html("=pair()", { components: { pair } }).html).toBe("<p>a</p><p>b</p>");
		});

		it("reports what a component reports, at its node", () => {
			const strict: Component = (_first, _named, { report }) => {
				report("Too loose", "Tighten it.");
				return null;
			};
			const { problems } = render(parse("=strict()"), { components: { strict } });
			expect(problems).toEqual([
				{ message: "Too loose", hint: "Tighten it.", position: expect.objectContaining({}) },
			]);
		});

		it("renders a call whose component throws as its source text, and reports it", () => {
			const broken: Component = () => {
				throw new Error("no luck");
			};
			const result = html("=broken()", { components: { broken } });
			expect(result.html).toBe("<p>=broken()</p>");
			expect(result.problems).toEqual(["`broken` failed: no luck"]);
		});

		it("looks components up as own properties only", () => {
			expect(html("=constructor()").problems).toEqual(["No macro or component is called `constructor`"]);
		});
	});
});
