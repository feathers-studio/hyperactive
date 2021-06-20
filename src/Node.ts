import { Element } from "./elements.ts";

type Falsy = false | "" | 0 | 0n | undefined | null;

const Falsy = new Set([false, "", 0, 0n, undefined, null]);
// deno-lint-ignore no-explicit-any
const isFalsy = (n: any): n is Falsy => Falsy.has(n);

type Attr = Record<string, string>;

class Node<Tag extends Element = Element, Attrs extends Attr = Attr> {
	constructor(
		public tag: Tag,
		public attrs: Attrs,
		public children: Node[],
	) {}
}

// deno-lint-ignore no-explicit-any
const isNode = (n: any): n is Node => n instanceof Node;

function h<Tag extends Element = Element, Attrs extends Attr = Attr>(
	elem: Tag,
	props?: Attrs | Falsy,
): Node<Tag>;

function h<Tag extends Element = Element>(
	elem: Tag,
	...children: (Node | Falsy)[]
): Node<Tag>;

function h<Tag extends Element, Attrs extends Attr = Attr>(
	elem: Tag,
	props: Attr,
	...children: Node[]
): Node<Tag>;

function h<Tag extends Element, Attrs extends Attr = Attr>(
	elem: Tag,
	props?: Attrs | Node | Falsy,
	...children: (Node | Falsy)[]
): Node<Tag>;

function h(
	elem: Element,
	props?: Attr | Node | Falsy,
	...childNodes: (Node | Falsy)[]
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

type hElement<Tag extends Element = Element> =
	//
	((props?: Node["attrs"]) => Node<Tag>) &
		(<Nodeish extends Node | Falsy>(childNode: Nodeish) => Node<Tag>) &
		((props: Node["attrs"], ...childNodes: (Node | Falsy)[]) => Node<Tag>);

export const elements = <Elems extends Element[]>(...elems: Elems) => {
	return elems.map(
		(elem): hElement<typeof elem> =>
			(
				props?: Node["attrs"] | Node | Falsy,
				...childNodes: (Node | Falsy)[]
			) =>
				h(elem, props, ...childNodes),
	) as {
		[Index in keyof Elems]: hElement<
			// @ts-ignore TypeScript pls
			Elems[Index]
		>;
	};
};
