import type { HyperNode } from "./node.ts";
import { SimpleState } from "./state.ts";

export const bind = <N extends HyperNode, State extends SimpleState>(node: N, state: State): N => {
	const oldRef = node.attrs.ref || (() => {});

	// @ts-expect-error do element-aware init and publish
	node.attrs.value = state.init;

	node.attrs.ref = (el) => {
		oldRef(el);
		el.addEventListener("input", (e) => state.publish((e?.target as unknown as { value: string }).value));
	};

	return node;
};
