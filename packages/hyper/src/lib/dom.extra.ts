import type { Console, GlobalEventHandlersEventMap, WindowOrWorkerGlobalScope } from "./dom.ts";
export type { Document, HTMLElement, HTMLElementTagNameMap, Node, Text } from "./dom.ts";

declare global {
	var setTimeout: WindowOrWorkerGlobalScope["setTimeout"];
	var clearTimeout: WindowOrWorkerGlobalScope["clearTimeout"];
	var setInterval: WindowOrWorkerGlobalScope["setInterval"];
	var clearInterval: WindowOrWorkerGlobalScope["clearInterval"];
	var console: Console;
}

type EMap = GlobalEventHandlersEventMap;

export type DOMEvents = {
	on: { [Event in keyof EMap]?: (e: EMap[Event]) => void };
};
