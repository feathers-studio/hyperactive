export type { Attributes } from "./attributes.ts";
export { h, trust, HyperNode, type HyperNodeish, isHyperNodeish } from "./node.ts";
export { State, ReadonlyState } from "./state.ts";
export { List, ReadonlyList, Member, ReadonlyMember } from "./list.ts";
export { renderHTML } from "./render/html.ts";
export { renderDOM } from "./render/dom.ts";

import { State } from "./state.ts";
import { List } from "./list.ts";

export const state = <T = any>(value: T) => new State(value);
export const list = <T = any>(init?: Iterable<T>) => new List(init);

// export * from "./domutils.ts";
// export * from "./history.ts";
// export * from "./router.ts";
