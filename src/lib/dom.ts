import type { GlobalEventHandlersEventMap } from "../../vendor/dom.lib.ts";

export type { HTMLElement, ChildNode, Document } from "../../vendor/dom.lib.ts";

type EMap = GlobalEventHandlersEventMap;

type MappedPartial<T> = {} & { [P in keyof T]?: T[P] };

export type DOMEvents = {
	on: MappedPartial<{ [Event in keyof EMap]: (e: EMap[Event]) => void }>;
};
