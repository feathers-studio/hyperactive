import { h, HyperNode, normaliseParams } from "./node.ts";
import { parseSelector } from "./parse.ts";
import { isNonNullable } from "./util.ts";
import type { HyperNodeish, NonEmptyElement } from "./node.ts";
import type { Tag } from "./lib/tags.ts";
import type { EmptyElements } from "./lib/emptyElements.ts";
import type { Attributes } from "./lib/attributes.ts";

export namespace Hyper {
	export interface Empty<T extends Tag> {
		// no children for empty tags
		(props?: Attributes<T>): HyperNode<T>;
		[selector: string]: Hyper.Empty<T>;
	}

	export interface Base<T extends Tag> {
		(props: Attributes<T>): HyperNode<T>;
		(...childNodes: HyperNodeish[]): HyperNode<T>;
		(props: Attributes<T>, ...childNodes: HyperNodeish[]): HyperNode<T>;
		[selector: string]: Hyper.Base<T>;
	}

	export type Element<T extends Tag = Tag> = T extends EmptyElements ? Hyper.Empty<T> : Hyper.Base<T>;
}

export type Elements = { [k in Tag]: Hyper.Element<k> };

function createSelectorProxy<T extends Tag>(
	element: T,
	hyperElement: Hyper.Element<T>,
	loaded?: string,
): Hyper.Element<T> {
	type hE = Hyper.Element<T>;

	return new Proxy(hyperElement, {
		get(_: hE, selector: string) {
			const parsed = parseSelector([loaded, selector].filter(Boolean).join(" "));

			const hyperElement = function hyperElement(props?: Attributes<T> | HyperNodeish, ...childNodes: HyperNodeish[]) {
				const { attrs, children } = normaliseParams(props, childNodes);

				const merged = {
					...attrs,
					id: parsed.id || attrs.id,
					class: [parsed.class, attrs.class].flatMap(x => (x ? x : undefined)),
				};

				return new HyperNode(element, merged, children.filter(isNonNullable));
			} as hE;

			return createSelectorProxy(element, hyperElement, selector);
		},
	});
}

export const elements = new Proxy({} as Elements, {
	get<T extends Tag>(target: Elements, element: T): Hyper.Element<T> {
		const fromCache = target[element];
		if (fromCache) return fromCache;

		const hyperElement = function hyperElement(...params: any[]) {
			return h(element as NonEmptyElement, ...params);
		} as Elements[T];

		target[element] = createSelectorProxy(element, hyperElement) as any;
		return target[element];
	},
});
