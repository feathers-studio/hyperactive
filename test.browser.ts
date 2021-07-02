/// <reference path="https://raw.githubusercontent.com/microsoft/TypeScript/cec2fda9a53620dc545a2c4d7b0156446ab145b4/lib/lib.dom.d.ts" />

import { elements, renderDOM, State } from "./mod.ts";

const { div, input, h3, p, span } = elements;

const state = State.simple("1");

renderDOM(
	document.getElementById("root")!,
	div(
		{ class: "container" },
		h3("Enter a number, it should double below"),
		input({ id: "input-el", value: state.init }),
		p(state.transform(v => span(String(parseFloat(v) * 2)))),
	),
);

document.querySelector("#input-el")?.addEventListener("input", e => {
	state.publish((e.target as unknown as { value: string }).value);
});
