import { Nodeish, Node, NonEmptyElement, h } from "./node.ts";
import { Element, CustomTag } from "./lib/elements.ts";
import { EmptyElements } from "./lib/emptyElements.ts";
import { Attr } from "./lib/attributes.ts";

export type hElement<
	Tag extends Element = Element,
	Attrs extends Attr<Tag> = Attr<Tag>,
> = (() => Node<Tag, Attrs>) &
	(Tag extends EmptyElements
		? (props: Attrs) => Node<Tag, Attrs>
		: ((childNode: Nodeish) => Node<Tag, Attrs>) &
				// order must be preserved, otherwise TS thinks State -> Node is invalid
				((...childNodes: Nodeish[]) => Node<Tag, Attrs>) &
				((props: Attrs) => Node<Tag, Attrs>) &
				((props: Attrs, ...childNodes: Nodeish[]) => Node<Tag, Attrs>));

const hElementCache = new Map<Element, hElement>();

function getHElement<Elem extends Element>(
	element: Elem,
): hElement<Elem, Attr<Elem>> {
	type hE = hElement<Elem, Attr<Elem>>;

	const fromCache = hElementCache.get(element);
	if (fromCache) return fromCache as hE;

	const hElement = function hElement(
		props?: Attr<Elem> | Nodeish,
		...childNodes: Nodeish[]
	) {
		return h(element as NonEmptyElement, props, ...childNodes);
	} as hE;

	hElementCache.set(element, hElement as hElement);
	return hElement;
}

export type ElementsToHElements<Elements extends Element[]> =
	// infer as tuple
	Elements extends [infer E, ...infer Rest]
		? E extends Element
			? Rest extends Element[]
				? [hElement<E>, ...ElementsToHElements<Rest>]
				: []
			: []
		: [];

function mapElements<Elements extends Element[]>(...elements: Elements) {
	return elements.map(getHElement) as ElementsToHElements<Elements>;
}

export const elements = new Proxy(mapElements, {
	get<E extends Element>(_: unknown, element: E): hElement<E> {
		return getHElement(element);
	},
}) as typeof mapElements & { [k in Exclude<Element, CustomTag>]: hElement<k> };
