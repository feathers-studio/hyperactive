import { Element } from "./elements.ts";

export type Falsy = false | "" | 0 | 0n | undefined | null;

export const Falsy = new Set([false, "", 0, 0n, undefined, null]);
// deno-lint-ignore no-explicit-any
export const isFalsy = (n: any): n is Falsy => Falsy.has(n);

export type Attr = Record<string, string>;

export type TextNode = string;

export type Nodeish<Tag extends Element = Element> =
	| Node<Tag>
	| TextNode
	| Falsy;

export class Node<Tag extends Element = Element, Attrs extends Attr = Attr> {
	constructor(
		public tag: Tag,
		public attrs: Attrs,
		public children: (Node | TextNode)[],
	) {}
}

// deno-lint-ignore no-explicit-any
export const isNode = (n: any): n is Node | TextNode =>
	n instanceof Node || typeof n === "string";

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
		(<TNodeish extends Nodeish>(childNode: TNodeish) => Node<Tag>) &
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
