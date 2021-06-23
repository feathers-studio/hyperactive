///<reference path="https://raw.githubusercontent.com/denoland/deno/main/cli/dts/lib.deno.ns.d.ts" />
///<reference path="https://raw.githubusercontent.com/microsoft/TypeScript/main/lib/lib.dom.d.ts" />

import { elements, renderDOM, State } from "./mod.ts";

const { div, input, h3, p } = elements;

const state = State.simple("1");

setTimeout(() => {
	document.querySelector("#input-el")?.addEventListener("input", e => {
		state.publish((e.target as unknown as { value: string }).value);
	});
}, 1000);

renderDOM(
	document.getElementById("root")!,
	div(
		{ class: "container" },
		h3("Enter a number, it should double below"),
		input({ id: "input-el", value: state.init }),
		p(state.map(v => String(parseFloat(v) * 2))),
	),
);
