import { Element, CustomTag } from "./elements.ts";
import { Falsy, isFalsy } from "./util.ts";

export type Attr = Record<string, string>;

export type TextNode = string;

export class HTMLNode {
	constructor(public htmlString: string) {}
}

export class Node<Tag extends Element = Element, Attrs extends Attr = Attr> {
	constructor(
		public tag: Tag,
		public attrs: Attrs,
		public children: (Node | TextNode)[],
	) {}
}

export type Nodeish<Tag extends Element = Element> =
	| Node<Tag>
	| TextNode
	| HTMLNode
	| Falsy;

// deno-lint-ignore no-explicit-any
export const isNode = (n: any): n is Node | HTMLNode | TextNode =>
	n instanceof Node || n instanceof HTMLNode || typeof n === "string";

export function h<Tag extends Element = Element, Attrs extends Attr = Attr>(
	elem: Tag,
	props?: Attrs | Falsy,
): Node<Tag>;

export function h<Tag extends Element = Element>(
	elem: Tag,
	...children: Nodeish[]
): Node<Tag>;

export function h<Tag extends Element, Attrs extends Attr = Attr>(
	elem: Tag,
	props: Attr,
	...children: Nodeish[]
): Node<Tag>;

export function h<Tag extends Element, Attrs extends Attr = Attr>(
	elem: Tag,
	props?: Attrs | Nodeish | Falsy,
	...children: Nodeish[]
): Node<Tag>;

export function h(
	elem: Element,
	props?: Attr | Nodeish,
	...childNodes: Nodeish[]
): Node {
	const [attrs, children] =
		isNode(props) || isFalsy(props)
			? [{}, [props, ...childNodes]]
			: [props || {}, childNodes || []];

	return new Node(
		elem,
		attrs,
		children
			// filter falsy nodes
			.filter((child): child is Node => (child ? true : false)),
	);
}

export type hElement<Tag extends Element = Element> =
	//
	((props?: Attr) => Node<Tag>) &
		((...childNodes: Nodeish[]) => Node<Tag>) &
		((props: Attr, ...childNodes: Nodeish[]) => Node<Tag>);

function getHElement<Elem extends Element>(elem: Elem): hElement<typeof elem> {
	return function hElement(props?: Attr | Nodeish, ...childNodes: Nodeish[]) {
		return h(elem, props, ...childNodes);
	};
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

export function trust(html: string) {
	return new HTMLNode(html);
}
