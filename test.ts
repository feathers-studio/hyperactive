import { assertEquals } from "https://deno.land/std@0.99.0/testing/asserts.ts";

import { elements, trust, renderHTML } from "./mod.ts";

const { div, p, h1, br } = elements;

Deno.test({
	name: "renderHTML simple",
	fn: () => {
		assertEquals(
			renderHTML(div({ id: "hello", class: "world" }, "Hello world")),
			`<div id="hello" class="world">Hello world</div>`,
		);
	},
});

Deno.test({
	name: "renderHTML complex",
	fn: () => {
		assertEquals(
			renderHTML(
				div(
					{ id: "hello", class: "world" },
					p(h1({ class: "hello" }, "hello world", br())),
				),
			),
			`<div id="hello" class="world"><p><h1 class="hello">hello world<br /></h1></p></div>`,
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
	name: "elements() - elements[] equivalence",
	fn: () => {
		const { div, p } = elements;
		const [div2, p2] = elements("div", "p");
		assertEquals(
			renderHTML(div(p("Hello"))),
			renderHTML(div2(p2("Hello"))),
		);
	},
});

Deno.test({
	name: "elements() - elements[] equality",
	fn: () => {
		const { div, p } = elements;
		const { div: div2, p: p2 } = elements;

		const [div3, p3] = elements("div", "p");
		const [div4, p4] = elements("div", "p");

		assertEquals(div, div2);
		assertEquals(p, p2);

		assertEquals(div, div3);
		assertEquals(p, p3);

		assertEquals(div, div4);
		assertEquals(p, p4);
	},
});

Deno.test({
	name: "renderHTML with custom element",
	fn: () => {
		const [el] = elements("custom-element");
		assertEquals(renderHTML(el()), `<custom-element />`);
	},
});
