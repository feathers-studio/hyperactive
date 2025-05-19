// @ts-nocheck This file is not yet ready for use

import { type HyperNode } from "./node.ts";
import { State } from "./state.ts";

type RouteFragment = [(path: string) => boolean, HyperNode<any> | null];

export function leaf(
	pathlike: (path: string) => boolean,
	node: HyperNode<any> | null,
): RouteFragment {
	return [pathlike, node];
}

export function router(...routes: RouteFragment[]): State<HyperNode<any> | null> {
	const match = (routes: RouteFragment[], location: Location): HyperNode<any> | null => {
		for (const [pattern, node] of routes) if (pattern(location.pathname)) return node;
		return null;
	};

	// Initial setup
	const state = new State<HyperNode<any> | null>(match(routes, history.location));

	// Update when history is updated
	history.listen(update => state.set(match(routes, update.location)));

	return state;
}
