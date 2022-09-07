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

export type Elements = { [k in Tag]: Hyper.Element<k> };

export const elements = new Proxy({} as Elements, {
	get<E extends Tag>(target: Elements, element: E): Hyper.Element<E> {
		const fromCache = target[element];
		if (fromCache) return fromCache;

		const hyperElement = function hyperElement(...params: any[]) {
			return h(element as NonEmptyElement, ...params);
		} as Elements[E];

		target[element] = hyperElement;
		return createSelectorProxy(element, hyperElement);
	},
});
