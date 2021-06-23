import { Element, CustomTag } from "./elements.ts";
import { Nodeish, Attr, Node, h } from "./Node.ts";

export type hElement<Tag extends Element = Element> =
	//
	((props?: Attr | Nodeish) => Node<Tag>) &
		((...childNodes: Nodeish[]) => Node<Tag>) &
		((props: Attr, ...childNodes: Nodeish[]) => Node<Tag>);

const hElementCache = new Map<Element, hElement>();

function getHElement<Elem extends Element>(element: Elem): hElement<Elem> {
	const fromCache = hElementCache.get(element);
	if (fromCache) return fromCache as hElement<Elem>;

	function hElement(props?: Attr | Nodeish, ...childNodes: Nodeish[]) {
		return h(element, props, ...childNodes);
	}

	hElementCache.set(element, hElement);
	return hElement;
}

export type ElementsToHElements<Elements extends [...Element[]]> = {
	[Index in keyof Elements]: hElement<
		// @ts-ignore TypeScript pls
		Elements[Index]
	>;
} & { length: Elements["length"] };

function mapElements<Elements extends Element[]>(...elements: Elements) {
	return elements.map(getHElement) as ElementsToHElements<Elements>;
}

export const elements = new Proxy(mapElements, {
	get<E extends Element>(_: unknown, element: E): hElement<E> {
		return getHElement(element);
	},
}) as typeof mapElements & { [k in Exclude<Element, CustomTag>]: hElement<k> };
