import type { GlobalEventHandlersEventMap } from "../../external/dom.lib.ts";

export type {
	HTMLElement,
	ChildNode,
	Document,
} from "../../external/dom.lib.ts";

type EMap = GlobalEventHandlersEventMap;

export type DOMEvents = {
	on: Partial<{ [Event in keyof EMap]: (e: EMap[Event]) => void }>;
};
