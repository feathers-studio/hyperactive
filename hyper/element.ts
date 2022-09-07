import { h, HyperNode, HyperNodeish, NonEmptyElement, normaliseParams } from "./node.ts";
import { CustomTag, Tag } from "./lib/tags.ts";
import { EmptyElements } from "./lib/emptyElements.ts";
import { Attr } from "./lib/attributes.ts";
import { parseSelector } from "./parse.ts";

export namespace Hyper {
	export interface Empty<T extends Tag, Attrs extends Attr<T>> {
		// no children for empty tags
		(props?: Attrs): HyperNode<T, Attrs>;
		[selector: string]: Hyper.Element<T, Attrs>;
	}

	export interface Base<T extends Tag, Attrs extends Attr<T>> {
		// order must be preserved, otherwise TS thinks State -> Node is invalid
		(childNode: HyperNodeish): HyperNode<T, Attrs>;
		(...childNodes: HyperNodeish[]): HyperNode<T, Attrs>;
		(props: Attrs): HyperNode<T, Attrs>;
		(props: Attrs, ...childNodes: HyperNodeish[]): HyperNode<T, Attrs>;
		[selector: string]: Hyper.Element<T, Attrs>;
	}

	export type Element<T extends Tag = Tag, Attrs extends Attr<T> = Attr<T>> = T extends EmptyElements
		? Hyper.Empty<T, Attrs>
		: Hyper.Base<T, Attrs>;
}

function createSelectorProxy<Elem extends Tag>(
	element: Elem,
	hyperElement: Hyper.Element<Elem, Attr<Elem>>,
	loaded?: string,
): Hyper.Element<Elem, Attr<Elem>> {
	type hE = Hyper.Element<Elem, Attr<Elem>>;

	return new Proxy(hyperElement, {
		get(_: hE, selector: string) {
			const parsed = parseSelector([loaded, selector].filter(Boolean).join(" "));

			const hyperElement = function hyperElement(props?: Attr<Elem> | HyperNodeish, ...childNodes: HyperNodeish[]) {
				const { attrs, children } = normaliseParams(props, childNodes);

				const merged = {
					...attrs,
					id: parsed.id || attrs.id,
					class: [parsed.class, attrs.class].flatMap(x => (x ? x : undefined)),
				};

				return new HyperNode(
					element,
					merged,
					// filter falsy nodes
					children.filter(Boolean) as HyperNode[],
				);
			} as hE;

			return createSelectorProxy(element, hyperElement, selector);
		},
	});
}

const cache = new Map<Tag, Hyper.Element>();

function getElement<Elem extends Tag>(element: Elem): Hyper.Element<Elem, Attr<Elem>> {
	type HE = Hyper.Element<Elem, Attr<Elem>>;

	const fromCache = cache.get(element);
	if (fromCache) return fromCache as HE;

	function hyperElement(...params: any[]) {
		return h(element as NonEmptyElement, ...params);
	}

	cache.set(element, hyperElement as Hyper.Element);

	return createSelectorProxy(element, hyperElement as HE);
}

export type ElementsToHyper<Elements extends Tag[]> =
	// infer as tuple
	Elements extends [infer E, ...infer Rest]
		? E extends Tag
			? Rest extends Tag[]
				? [Hyper.Element<E>, ...ElementsToHyper<Rest>]
				: []
			: []
		: [];

function mapElements<Elements extends Tag[]>(...elements: Elements) {
	return elements.map(getElement) as ElementsToHyper<Elements>;
}

export const elements = new Proxy(mapElements, {
	get<E extends Tag>(_: unknown, element: E): Hyper.Element<E> {
		return getElement(element);
	},
}) as typeof mapElements & { [k in Exclude<Tag, CustomTag>]: Hyper.Element<k> };
