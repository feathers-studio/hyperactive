import type { GlobalEventHandlersEventMap } from "./dom.ts";
export type { Document, HTMLElement, HTMLElementTagNameMap, Node, Text } from "./dom.ts";

type EMap = GlobalEventHandlersEventMap;

export type DOMEvents = {
	on: { [Event in keyof EMap]?: (e: EMap[Event]) => void };
};
