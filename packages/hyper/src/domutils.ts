// @ts-nocheck

import { State } from "./state.ts";
import type { HyperNode } from "./node.ts";
import type { HTMLInputElement } from "./lib/dom.ts";

export const bind = <N extends HyperNode<"input">, S extends State>(node: N, state: S): N => {
	const oldRef = node.attrs.ref || (() => {});

	node.attrs.ref = (el: HTMLInputElement) => {
		el.value = state.value;
		state.listen(value => (el.value = value));
		el.addEventListener("input", e => state.publish((e?.target as unknown as { value: string }).value));
		oldRef(el as any);
	};

	return node;
};
