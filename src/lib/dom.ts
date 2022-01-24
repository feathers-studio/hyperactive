import type { GlobalEventHandlersEventMap } from "../../vendor/dom.slim.ts";

export type { HTMLElement, Text, Node as DOMNode, Document } from "../../vendor/dom.slim.ts";

type EMap = GlobalEventHandlersEventMap;

type MappedPartial<T> = {} & { [P in keyof T]?: T[P] };

export type DOMEvents = {
	on: MappedPartial<{ [Event in keyof EMap]: (e: EMap[Event]) => void }>;
};
