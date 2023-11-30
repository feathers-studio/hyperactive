import { h, HyperNode, HyperNodeish, NonEmptyElement, normaliseParams } from "./node.ts";
import { Tag } from "./lib/tags.ts";
import { EmptyElements } from "./lib/emptyElements.ts";
import { Attr } from "./lib/attributes.ts";
import { parseSelector } from "./parse.ts";

export namespace Hyper {
	export interface Empty<T extends Tag> {
		// no children for empty tags
		(props?: Attr<T>): HyperNode<T>;
		[selector: string]: Hyper.Empty<T>;
	}

	export interface Base<T extends Tag> {
		(...childNodes: HyperNodeish[]): HyperNode<T>;
		(props: Attr<T>, ...childNodes: HyperNodeish[]): HyperNode<T>;
		[selector: string]: Hyper.Base<T>;
	}

	export type Element<T extends Tag = Tag> = T extends EmptyElements ? Hyper.Empty<T> : Hyper.Base<T>;
}
export type Expand<T> = T extends object ? (T extends infer O ? { [K in keyof O]: O[K] } : never) : T;
export type ExpandDeep<T> = T extends object ? (T extends infer O ? { [K in keyof O]: ExpandDeep<O[K]> } : never) : T;
function createSelectorProxy<T extends Tag>(
	element: T,
	hyperElement: Hyper.Element<T>,
	loaded?: string,
): Hyper.Element<T> {
	type hE = Hyper.Element<T>;

	return new Proxy(hyperElement, {
		get(_: hE, selector: string) {
			const parsed = parseSelector([loaded, selector].filter(Boolean).join(" "));

			const hyperElement = function hyperElement(props?: Attr<T> | HyperNodeish, ...childNodes: HyperNodeish[]) {
				const { attrs, children } = normaliseParams(props, childNodes);

				const merged = {
					...attrs,
					id: parsed.id || attrs.id,
					class: [
						parsed.class,
						// this cast is safe, and helps narrow x in the flatMap below
						(attrs as Attr<Tag>).class,
					].flatMap(x => (x ? x : undefined)),
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
