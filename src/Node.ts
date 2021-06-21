import { Element } from "./elements.ts";
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

export const elements = <Elems extends Element[]>(...elems: Elems) => {
	return elems.map(
		(elem): hElement<typeof elem> =>
			(props?: Attr | Nodeish, ...childNodes: Nodeish[]) =>
				h(elem, props, ...childNodes),
	) as {
		[Index in keyof Elems]: hElement<
			// @ts-ignore TypeScript pls
			Elems[Index]
		>;
	};
};

export function trust(html: string) {
	return new HTMLNode(html);
}
