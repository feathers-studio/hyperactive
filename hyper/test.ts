import { assertEquals } from "./vendor/deno/asserts.ts";

import { elements, renderHTML, trust } from "./mod.ts";

const { div, p, h1, br, input } = elements;

Deno.test({
	name: "renderHTML simple",
	fn: () => {
		assertEquals(
			renderHTML(div({ id: "hello", class: "world" }, "Hello world")),
			`<div id="hello" class="world">Hello world</div>`,
		);
	},
});

// we don't support data-attr yet, due to weird TS bugs
// Deno.test({
// 	name: "renderHTML simple with data-attr",
// 	fn: () => {
// 		assertEquals(
// 			renderHTML(div({ "id": "hello", "class": "world", "data-attr": "value" }, "Hello world")),
// 			`<div id="hello" class="world" "data-attr"="value">Hello world</div>`,
// 		);
// 	},
// });

Deno.test({
	name: "renderHTML simple - escaping attribute and text nodes",
	fn: () => {
		assertEquals(
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
			`<div id="hello" class="world" style="content: &#39;&quot;&amp;&quot;&lt;/div&gt;&#39;">&lt;'"Hello&amp;world"'&gt;</div>`,
		);
	},
});

Deno.test({
	name: "renderHTML simple - class array",
	fn: () => {
		assertEquals(
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
			`<div id="hello" class="d-flex justify-content-between mb-3" style="content: &#39;&quot;&amp;&quot;&lt;/div&gt;&#39;">&lt;'"Hello&amp;world"'&gt;</div>`,
		);
	},
});

Deno.test({
	name: "renderHTML complex",
	fn: () => {
		assertEquals(
			renderHTML(div({ id: "hello", class: "world" }, p(h1({ class: "hello" }, "hello world", br())))),
			`<div id="hello" class="world"><p><h1 class="hello">hello world<br /></h1></p></div>`,
		);
	},
});

Deno.test({
	name: "renderHTML ARIA props",
	fn: () => {
		assertEquals(
			renderHTML(
				div({
					id: "hello",
					class: "world",
					role: "note",
					aria: { disabled: "true" },
				}),
			),
			`<div id="hello" class="world" role="note" aria-disabled="true"></div>`,
		);
	},
});

Deno.test({
	name: "renderHTML with HTML characters",
	fn: () => {
		assertEquals(renderHTML(p("<test />")), `<p>&lt;test /&gt;</p>`);
	},
});

Deno.test({
	name: "renderHTML with trusted HTML",
	fn: () => {
		assertEquals(renderHTML(p(trust("<test />"))), `<p><test /></p>`);
	},
});

Deno.test({
	name: "renderHTML with boolean attributes",
	fn: () => {
		assertEquals(renderHTML(input({ disabled: true })), `<input disabled />`);

		assertEquals(renderHTML(input({ disabled: false })), `<input />`);
	},
});

Deno.test({
	name: "renderHTML with numeric attributes",
	fn: () => {
		assertEquals(renderHTML(input({ step: 5 })), `<input step="5" />`);
	},
});

Deno.test({
	name: "renderHTML with undefined attributes",
	fn: () => {
		assertEquals(renderHTML(input({ step: undefined })), `<input />`);
	},
});

Deno.test({
	name: "renderHTML with emptyElements",
	fn: () => {
		assertEquals(renderHTML(br()), `<br />`);
	},
});

Deno.test({
	name: "renderHTML skips events",
	fn: () => {
		assertEquals(
			renderHTML(
				input({
					on: {
						input: e => console.log((e?.target as unknown as { value: string }).value),
					},
				}),
			),
			`<input />`,
		);
	},
});

Deno.test({
	name: "renderHTML with simple selector syntax",
	fn: () => {
		assertEquals(
			renderHTML(
				//
				div["hello"]("test"),
			),
			`<div class="hello">test</div>`,
		);
	},
});

Deno.test({
	name: "renderHTML with multiple selector syntax",
	fn: () => {
		assertEquals(
			renderHTML(
				//
				div.hello.world("test"),
			),
			`<div class="hello world">test</div>`,
		);
	},
});

Deno.test({
	name: "renderHTML with complex selector syntax",
	fn: () => {
		assertEquals(
			renderHTML(
				//
				div[".hello#id.world"].container("test"),
			),
			`<div id="id" class="hello world container">test</div>`,
		);
	},
});

Deno.test({
	name: "renderHTML with selector syntax AND attributes",
	fn: () => {
		assertEquals(
			renderHTML(
				//
				div[".hello#id.world"].container({ class: "flex", title: "Flex Container" }, "test"),
			),
			`<div class="hello world container flex" title="Flex Container" id="id">test</div>`,
		);
	},
});

Deno.test({
	name: "elements[] equality",
	fn: () => {
		// checks that proxy fetches from cache instead of creating a new function each time
		const div = elements.div;
		const div2 = elements.div;

		const p = elements.p;
		const p2 = elements.p;
		assertEquals(div, div2);
		assertEquals(p, p2);
	},
});
