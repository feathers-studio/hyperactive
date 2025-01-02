import { test, expect } from "bun:test";

import { renderHTML, trust } from "./index.ts";
import { div, p, h1, br, input } from "./elements.ts";

test("renderHTML simple", () => {
	expect(renderHTML(div({ id: "hello", class: "world" }, "Hello world"))).toBe(
		`<div id="hello" class="world">Hello world</div>`,
	);
});

// we don't support data-attr yet, due to weird TS bugs
test("renderHTML simple with data-attr", () => {
	expect(renderHTML(div({ "id": "hello", "class": "world", "data-attr": "value" }, "Hello world"))).toBe(
		`<div id="hello" class="world" data-attr="value">Hello world</div>`,
	);
});

test("renderHTML simple - escaping attribute and text nodes", () => {
	expect(
		renderHTML(
			div(
				{
					id: "hello",
					class: "world",
					style: `content: '"&"</div>'`,
				},
				"<'\"Hello&world\"'>",
			),
		),
	).toBe(
		`<div id="hello" class="world" style="content: &#39;&quot;&amp;&quot;&lt;/div&gt;&#39;">&lt;'"Hello&amp;world"'&gt;</div>`,
	);
});

test("renderHTML simple - class array", () => {
	expect(
		renderHTML(
			div(
				{
					id: "hello",
					class: ["d-flex", "justify-content-between", "mb-3", false],
					style: `content: '"&"</div>'`,
				},
				"<'\"Hello&world\"'>",
			),
		),
	).toBe(
		`<div id="hello" class="d-flex justify-content-between mb-3" style="content: &#39;&quot;&amp;&quot;&lt;/div&gt;&#39;">&lt;'"Hello&amp;world"'&gt;</div>`,
	);
});

test("renderHTML complex", () => {
	expect(
		renderHTML(
			div(
				{
					id: "hello",
					class: "world",
					ref: el => console.log(el),
					on: { mousemove: e => console.log(e) },
				},
				p(h1({ class: "hello" }, "hello world", br())),
			),
		),
	).toBe(`<div id="hello" class="world"><p><h1 class="hello">hello world<br /></h1></p></div>`);
});

test("renderHTML ARIA props", () => {
	expect(
		renderHTML(
			div({
				id: "hello",
				class: "world",
				role: "note",
				aria: { disabled: "true" },
			}),
		),
	).toBe(`<div id="hello" class="world" role="note" aria-disabled="true"></div>`);
});

test("renderHTML with HTML characters", () => {
	expect(renderHTML(p("<test />"))).toBe(`<p>&lt;test /&gt;</p>`);
});

test("renderHTML with trusted HTML", () => {
	expect(renderHTML(p(trust("<test />")))).toBe(`<p><test /></p>`);
});

test("renderHTML with boolean attributes", () => {
	expect(renderHTML(input({ disabled: true }))).toBe(`<input disabled />`);

	expect(renderHTML(input({ disabled: false }))).toBe(`<input />`);
});

test("renderHTML with numeric attributes", () => {
	expect(renderHTML(input({ step: 5 }))).toBe(`<input step="5" />`);
});

test("renderHTML with undefined attributes", () => {
	expect(renderHTML(input({ step: undefined }))).toBe(`<input />`);
});

test("renderHTML with emptyElements", () => {
	expect(renderHTML(br())).toBe(`<br />`);
});

test("renderHTML skips events", () => {
	expect(
		renderHTML(
			input({
				on: {
					input: e => console.log((e?.target as unknown as { value: string }).value),
				},
			}),
		),
	).toBe(`<input />`);
});

test("renderHTML with simple selector syntax", () => {
	expect(
		renderHTML(
			//
			div["hello"]("test"),
		),
	).toBe(`<div class="hello">test</div>`);
});

test("renderHTML with multiple selector syntax", () => {
	expect(
		renderHTML(
			//
			div.hello.world("test"),
		),
	).toBe(`<div class="hello world">test</div>`);
});

test("renderHTML with complex selector syntax", () => {
	expect(
		renderHTML(
			//
			div[".hello#id.world"].container("test"),
		),
	).toBe(`<div id="id" class="hello world container">test</div>`);
});

test("renderHTML with selector syntax AND attributes", () => {
	expect(
		renderHTML(
			//
			div[".hello#id.world"].container({ class: "flex", title: "Flex Container" }, "test"),
		),
	).toBe(`<div class="hello world container flex" title="Flex Container" id="id">test</div>`);
});
