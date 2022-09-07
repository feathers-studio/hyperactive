import { Tag } from "./lib/tags.ts";
import { EmptyElements } from "./lib/emptyElements.ts";
import { Attr } from "./lib/attributes.ts";
import { Falsy, isFalsy } from "./util.ts";
import { isState, SimpleState, SimpleStateRO } from "./state.ts";

export type NonEmptyElement = Exclude<Tag, EmptyElements>;

export type HyperTextNode = string;

export class HyperHTMLStringNode {
	constructor(public htmlString: string) {}
}

export class HyperNode<T extends Tag = Tag, Attrs extends Attr = Attr> {
	constructor(public tag: T, public attrs: Attrs, public children: (HyperNode | HyperTextNode)[]) {}
}

export type HyperNodeish<T extends Tag = Tag> =
	| HyperNode<T>
	| HyperTextNode
	| HyperHTMLStringNode
	| Falsy
	| SimpleState<HyperNode<T> | HyperTextNode | HyperHTMLStringNode | Falsy>
	| SimpleStateRO<HyperNode<T> | HyperTextNode | HyperHTMLStringNode | Falsy>;

// deno-lint-ignore no-explicit-any
export const isHyperNode = (n: any): n is HyperNode | HyperHTMLStringNode | HyperTextNode =>
	n instanceof HyperNode || n instanceof HyperHTMLStringNode || typeof n === "string";

export function normaliseParams(props?: Attr | HyperNodeish, childNodes?: HyperNodeish[]) {
	const [attrs, children] =
		isHyperNode(props) || isFalsy(props) || isState(props)
			? [{}, [props, ...(childNodes || [])]]
			: [props || {}, childNodes || []];

	return { attrs, children };
}

export function h<Tag extends NonEmptyElement = NonEmptyElement, Attrs extends Attr = Attr>(
	elem: Tag,
	props?: Attrs | Falsy,
): HyperNode<Tag>;

export function h<Tag extends NonEmptyElement = NonEmptyElement>(
	elem: Tag,
	...children: HyperNodeish[]
): HyperNode<Tag>;

export function h<Tag extends NonEmptyElement, Attrs extends Attr<Tag> = Attr<Tag>>(
	elem: Tag,
	props: Attr,
	...children: HyperNodeish[]
): HyperNode<Tag>;

export function h<Tag extends NonEmptyElement, Attrs extends Attr<Tag> = Attr<Tag>>(
	elem: Tag,
	props?: Attrs | HyperNodeish | Falsy,
	...children: HyperNodeish[]
): HyperNode<Tag>;

export function h<Tag extends EmptyElements, Attrs extends Attr<Tag> = Attr<Tag>>(
	elem: Tag,
	props?: Attrs | HyperNodeish | Falsy,
): HyperNode<Tag>;

export function h(tag: Tag, props?: Attr | HyperNodeish, ...childNodes: HyperNodeish[]): HyperNode {
	const { attrs, children } = normaliseParams(props, childNodes);

	return new HyperNode(
		tag,
		attrs,
		children
			// filter falsy nodes
			.filter(Boolean) as HyperNode[],
	);
}

export function trust(html: string) {
	return new HyperHTMLStringNode(html);
}
