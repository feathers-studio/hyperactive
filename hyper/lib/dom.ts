import type { GlobalEventHandlersEventMap } from "../vendor/dom.slim.ts";
export type { Document, HTMLElement, Node, Text } from "../vendor/dom.slim.ts";

type EMap = GlobalEventHandlersEventMap;
type MappedPartial<T> = {} & { [P in keyof T]?: T[P] };
export type DOMEvents = {
	on: MappedPartial<{ [Event in keyof EMap]: (e: EMap[Event]) => void }>;
};
