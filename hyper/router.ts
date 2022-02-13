import { type HyperNode } from "./node.ts";
import { history, Location } from "./history.ts";
import { type SimpleState, State } from "./state.ts";

type RouteFragment = [URLPattern, HyperNode | null];

export function leaf(pathlike: string, node: HyperNode | null): RouteFragment {
	return [new URLPattern({ pathname: pathlike }), node];
}

export function router(...routes: RouteFragment[]): SimpleState<HyperNode | null> {
	const match = (routes: RouteFragment[], location: Location): HyperNode | null => {
		for (const [pattern, node] of routes) if (pattern.test(location)) return node;
		return null;
	};

	// Initial setup
	const state = State.simple<HyperNode | null>(match(routes, history.location));

	// Update when history is updated
	history.listen((update) => state.publish(match(routes, update.location)));

	return state;
}
