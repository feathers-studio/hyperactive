import type { GlobalEventHandlersEventMap } from "../vendor/dom.slim.ts";
export type { Document, HTMLElement, HTMLElementTagNameMap, Node, Text } from "../vendor/dom.slim.ts";

type EMap = GlobalEventHandlersEventMap;

export type DOMEvents = {
	on: { [Event in keyof EMap]?: (e: EMap[Event]) => void };
};
