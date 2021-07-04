/// <reference lib="deno.ns" />

// LKG upstream DOM lib
/// <reference path="https://raw.githubusercontent.com/microsoft/TypeScript/cec2fda9a53620dc545a2c4d7b0156446ab145b4/lib/lib.dom.d.ts" />

// Some day, one of these will work. We wait for some day.

// conflicts with Deno types
// <reference lib="dom" />

// Incorrect Element.append type, does not allow ChildNode
// <reference path="https://raw.githubusercontent.com/microsoft/TypeScript/main/lib/lib.dom.d.ts" />

export type HtmlElement = HTMLElement;

type EMap = GlobalEventHandlersEventMap;

export type DOMEvents = {
	on: Partial<{ [Event in keyof EMap]: (e: EMap[Event]) => void }>;
};
