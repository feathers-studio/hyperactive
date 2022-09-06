import { h, HyperNode, HyperNodeish, NonEmptyElement } from "./node.ts";
import { CustomTag, Element } from "./lib/elements.ts";
import { EmptyElements } from "./lib/emptyElements.ts";
import { Attr } from "./lib/attributes.ts";

export type hyperElement<Tag extends Element = Element, Attrs extends Attr<Tag> = Attr<Tag>> = (() => HyperNode<
	Tag,
	Attrs
>) &
	(Tag extends EmptyElements
		? (props: Attrs) => HyperNode<Tag, Attrs>
		: ((childNode: HyperNodeish) => HyperNode<Tag, Attrs>) & // order must be preserved, otherwise TS thinks State -> Node is invalid
				((...childNodes: HyperNodeish[]) => HyperNode<Tag, Attrs>) &
				((props: Attrs) => HyperNode<Tag, Attrs>) &
				((props: Attrs, ...childNodes: HyperNodeish[]) => HyperNode<Tag, Attrs>));

const hyperElementCache = new Map<Element, hyperElement>();

function getHyperElement<Elem extends Element>(element: Elem): hyperElement<Elem, Attr<Elem>> {
	type hE = hyperElement<Elem, Attr<Elem>>;

	const fromCache = hyperElementCache.get(element);
	if (fromCache) return fromCache as hE;

	const hyperElement = function hyperElement(props?: Attr<Elem> | HyperNodeish, ...childNodes: HyperNodeish[]) {
		return h(element as NonEmptyElement, props, ...childNodes);
	} as hE;

	hyperElementCache.set(element, hyperElement as hyperElement);
	return hyperElement;
}

export type ElementsToHyperElements<Elements extends Element[]> =
	// infer as tuple
	Elements extends [infer E, ...infer Rest]
		? E extends Element
			? Rest extends Element[]
				? [hyperElement<E>, ...ElementsToHyperElements<Rest>]
				: []
			: []
		: [];

function mapElements<Elements extends Element[]>(...elements: Elements) {
	return elements.map(getHyperElement) as ElementsToHyperElements<Elements>;
}

export const elements = new Proxy(mapElements, {
	get<E extends Element>(_: unknown, element: E): hyperElement<E> {
		return getHyperElement(element);
	},
}) as typeof mapElements & { [k in Exclude<Element, CustomTag>]: hyperElement<k> };
