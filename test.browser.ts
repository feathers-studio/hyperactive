///<reference path="https://raw.githubusercontent.com/denoland/deno/main/cli/dts/lib.deno.ns.d.ts" />
///<reference path="https://raw.githubusercontent.com/microsoft/TypeScript/main/lib/lib.dom.d.ts" />

import { elements, renderDOM } from "./mod.ts";

const { div, p } = elements;

renderDOM(
	document.getElementById("root")!,
	div({ class: "container" }, p("Hello world")),
);
