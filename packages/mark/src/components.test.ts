import { describe, it, expect } from "bun:test";
import { h, renderHTML } from "@hyperactive/hyper";
import { parse } from "./hypermark.ts";
import { render, type Component } from "./render.ts";

/** The HTML a document renders to, and its problems' messages. */
function html(source: string, components?: Record<string, Component>) {
	const { nodes, problems } = render(parse(source), { components });
	return { html: nodes.map(renderHTML).join(""), problems: problems.map(p => p.message) };
}

const PACKAGES = [
	'@variants("Package manager")',
	"- [npm]",
	"  ```sh",
	"  npm install telegraf",
	"  ```",
	"- [bun]",
	"  ```sh",
	"  bun add telegraf",
	"  ```",
].join("\n");

const sh = (command: string) => `<pre tabindex="0"><code class="language-sh">${command}</code></pre>`;

describe("details", () => {
	it("renders each labelled item as a details element, its label the summary", () => {
		const source = "@details()\n- [Why `strict`?]\n  It catches `undefined`.\n- [Why not?]\n  No reason.";
		expect(html(source)).toEqual({
			html: [
				"<details><summary>Why <code>strict</code>?</summary><p>It catches <code>undefined</code>.</p></details>",
				"<details><summary>Why not?</summary><p>No reason.</p></details>",
			].join(""),
			problems: [],
		});
	});

	it("shows an item without a label as it is, and reports it", () => {
		const result = html("@details()\n- [Shown]\n  A.\n- Not hidden.\n- [ ] A task.");
		expect(result.html).toBe(
			"<details><summary>Shown</summary><p>A.</p></details><p>Not hidden.</p><p>A task.</p>",
		);
		expect(result.problems).toEqual([
			"Item 2 of `@details` has no label",
			"Item 3 of `@details` has no label",
		]);
	});

	it("reports parameters it does not take", () => {
		expect(html('@details("FAQ", open)\n- [A]\n  B.').problems).toEqual([
			"`@details` takes no title",
			"`@details` has no parameter `open`",
		]);
	});
});

describe("variants", () => {
	it("renders each item as a variant named by its label, in a group titled by the parameter", () => {
		expect(html(PACKAGES)).toEqual({
			html: [
				'<div class="variants" data-variants="Package manager" role="group" aria-label="Package manager">',
				'<div class="variant" data-variant="npm">',
				`<div class="variant-label">npm</div>${sh("npm install telegraf")}`,
				"</div>",
				'<div class="variant" data-variant="bun">',
				`<div class="variant-label">bun</div>${sh("bun add telegraf")}`,
				"</div>",
				"</div>",
			].join(""),
			problems: [],
		});
	});

	it("names a variant by its label's text, and shows the label formatted", () => {
		expect(html("@variants()\n- [*Node* `20`]\n  Text.").html).toContain(
			'<div class="variant" data-variant="Node 20"><div class="variant-label"><strong>Node</strong> <code>20</code></div>',
		);
	});

	it("leaves an untitled group without an accessible name", () => {
		expect(html("@variants()\n- [a]\n  A.").html).toStartWith(
			'<div class="variants" data-variants role="group"><div class="variant" data-variant="a">',
		);
	});

	it("keeps an item without a label as a variant without a name, and reports it", () => {
		const result = html("@variants()\n- [a]\n  A.\n- B.");
		expect(result.html).toContain('<div class="variant"><p>B.</p></div>');
		expect(result.problems).toEqual(["Item 2 of `@variants` has no label"]);
	});

	it("reports two variants of the same name", () => {
		expect(html("@variants()\n- [npm]\n  A.\n- [*npm*]\n  B.").problems).toEqual([
			"`npm` is in `@variants` twice",
		]);
	});

	it("reports a title that is not a string, and renders the group untitled", () => {
		const result = html("@variants(2, sync)\n- [a]\n  A.");
		expect(result.html).toStartWith('<div class="variants" data-variants role="group">');
		expect(result.problems).toEqual([
			"`@variants` takes its title as a string",
			"`@variants` has no parameter `sync`",
		]);
	});
});

describe("both", () => {
	it("render a block that is not a list without decorating it, and report it", () => {
		for (const name of ["details", "variants"]) {
			expect(html(`@${name}()\n> A quote.`)).toEqual({
				html: "<blockquote><p>A quote.</p></blockquote>",
				problems: [`\`@${name}\` decorates a list`],
			});
		}
	});

	it("render a call of their name as its source text, and report it", () => {
		for (const name of ["details", "variants"]) {
			expect(html(`=${name}()`)).toEqual({
				html: `<p>=${name}()</p>`,
				problems: [`\`${name}\` is a decorator`],
			});
		}
	});

	it("are replaced by a site's component of the same name", () => {
		const variants: Component = () => h("p", {}, "mine");
		expect(html(PACKAGES, { variants }).html).toBe("<p>mine</p>");
	});
});
