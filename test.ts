import { assertEquals } from "https://deno.land/std@0.99.0/testing/asserts.ts";

import { elements, renderHTML } from "./mod.ts";

const [div, p, h1, br] = elements("div", "p", "h1", "br");

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
