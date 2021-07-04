import { Element } from "./elements.ts";
import { EmptyElements } from "./emptyElements.ts";
import { Attr } from "./attributes.ts";
import { Falsy, isFalsy } from "./util.ts";
import { SimpleState, SimpleStateRO, isState } from "./state.ts";

export type NonEmptyElement = Exclude<Element, EmptyElements>;

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
	| Falsy
	| SimpleState<Node<Tag> | TextNode | HTMLNode | Falsy>
	| SimpleStateRO<Node<Tag> | TextNode | HTMLNode | Falsy>;

// deno-lint-ignore no-explicit-any
export const isNode = (n: any): n is Node | HTMLNode | TextNode =>
	n instanceof Node || n instanceof HTMLNode || typeof n === "string";

export function h<
	Tag extends NonEmptyElement = NonEmptyElement,
	Attrs extends Attr = Attr,
>(elem: Tag, props?: Attrs | Falsy): Node<Tag>;

export function h<Tag extends NonEmptyElement = NonEmptyElement>(
	elem: Tag,
	...children: Nodeish[]
): Node<Tag>;

export function h<
	Tag extends NonEmptyElement,
	Attrs extends Attr<Tag> = Attr<Tag>,
>(elem: Tag, props: Attr, ...children: Nodeish[]): Node<Tag>;

export function h<
	Tag extends NonEmptyElement,
	Attrs extends Attr<Tag> = Attr<Tag>,
>(
	elem: Tag,
	props?: Attrs | Nodeish | Falsy,
	...children: Nodeish[]
): Node<Tag>;

export function h<
	Tag extends EmptyElements,
	Attrs extends Attr<Tag> = Attr<Tag>,
>(elem: Tag, props?: Attrs | Nodeish | Falsy): Node<Tag>;

export function h(
	elem: Element,
	props?: Attr | Nodeish,
	...childNodes: Nodeish[]
): Node {
	const [attrs, children] =
		isNode(props) || isFalsy(props) || isState(props)
			? [{}, [props, ...childNodes]]
			: [props || {}, childNodes || []];

	return new Node(
		elem,
		attrs,
		children
			// filter falsy nodes
			.filter((child): child is Node => Boolean(child)),
	);
}

export function trust(html: string) {
	return new HTMLNode(html);
}
