import { bind, elements, renderDOM, State } from "./mod.ts";

import type { Document } from "./lib/dom.ts";
declare const document: Document;

const { div, input, h3, p, span } = elements;

const state = State.simple("1");

const root = document.getElementById("root")!;

const title = h3("Enter a number, it should double below");

const output = p(state.transform(v => span(String(parseFloat(v) * 2))));

renderDOM(root, div({ class: "container" }, title, bind(input(), state), output, ""));
