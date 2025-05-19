import type {
	Console,
	Document,
	GlobalEventHandlersEventMap,
	WindowOrWorkerGlobalScope,
} from "./dom.ts";
export type { Document, HTMLElement, HTMLElementTagNameMap, Node, Text } from "./dom.ts";

export const domGlobal = globalThis as unknown as {
	document?: Document;
	setTimeout?: WindowOrWorkerGlobalScope["setTimeout"];
	clearTimeout?: WindowOrWorkerGlobalScope["clearTimeout"];
	setInterval?: WindowOrWorkerGlobalScope["setInterval"];
	clearInterval?: WindowOrWorkerGlobalScope["clearInterval"];
	console?: Console;
};

type EMap = GlobalEventHandlersEventMap;

export type DOMEvents = {
	on: { [Event in keyof EMap]?: (e: EMap[Event]) => void };
};
