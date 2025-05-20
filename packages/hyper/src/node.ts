import type { Tag } from "./lib/tags.ts";
import type { EmptyElements } from "./lib/emptyElements.ts";
import type { Attributes } from "./attributes.ts";
import { Falsy, isFalsy, isNonNullable } from "./util.ts";
import { ReadonlyState, State } from "./state.ts";
import * as Context from "./context.internal.ts";
import { Context as Context2 } from "./context.ts";
import { List, ReadonlyList } from "./list.ts";

export type NonEmptyElement = Exclude<Tag, EmptyElements>;

export type HyperTextNode = string;

export class HyperHTMLStringNode {
	constructor(public htmlString: string) {}
}

export class HyperComment {
	constructor(public text: string) {}
}

export class HyperNode<T extends Tag> {
	constructor(public tag: T, public attrs: Attributes<T>, public children: HyperNodeish[]) {}
}

export type HyperChild<T extends Tag> =
	| HyperNode<T>
	| HyperHTMLStringNode
	| HyperTextNode
	| HyperComment;

export type HyperNodeish =
	| HyperChild<any>
	| Falsy
	| Array<HyperNodeish>
	| ReadonlyState<HyperNodeish>
	| ReadonlyList<HyperNodeish>
	| List<HyperNodeish>
	| Context.Provider<any>
	| Context.Consumer<any>;

export const isHyperChild = (n: any): n is HyperChild<any> =>
	n instanceof HyperNode ||
	n instanceof HyperHTMLStringNode ||
	n instanceof HyperComment ||
	typeof n === "string" ||
	Array.isArray(n) ||
	ReadonlyState.isState(n) ||
	List.isList(n);

export const isHyperNodeish = (x: any): x is HyperNodeish =>
	isHyperChild(x) || isFalsy(x) || State.isState(x) || Context2.isContext(x);

export function normaliseParams<T extends Tag>(
	props?: Attributes<T> | HyperNodeish,
	childNodes?: HyperNodeish[],
) {
	const [attrs, children]: [Attributes<T>, HyperNodeish[]] = isHyperNodeish(props)
		? [{}, [props, ...(childNodes || [])]]
		: [props || {}, childNodes || []];

	return { attrs, children };
}

export function h<Tag extends NonEmptyElement, Attrs extends Attributes<Tag>>(
	elem: Tag,
	props?: Attrs | Falsy,
): HyperNode<Tag>;

export function h<Tag extends NonEmptyElement>(
	elem: Tag,
	...children: HyperNodeish[]
): HyperNode<Tag>;

export function h<Tag extends NonEmptyElement, Attrs extends Attributes<Tag>>(
	elem: Tag,
	props: Attrs,
	...children: HyperNodeish[]
): HyperNode<Tag>;

export function h<Tag extends NonEmptyElement, Attrs extends Attributes<Tag>>(
	elem: Tag,
	props?: Attrs | HyperNodeish | Falsy,
	...children: HyperNodeish[]
): HyperNode<Tag>;

export function h<Tag extends EmptyElements, Attrs extends Attributes<Tag>>(
	elem: Tag,
	props?: Attrs | HyperNodeish | Falsy,
): HyperNode<Tag>;

export function h<T extends Tag>(
	tag: T,
	props?: Attributes<T> | HyperNodeish,
	...childNodes: HyperNodeish[]
): HyperNode<T> {
	const { attrs, children } = normaliseParams(props, childNodes);
	return new HyperNode(tag, attrs, children.filter(isNonNullable));
}

export function trust(html: string) {
	return new HyperHTMLStringNode(html);
}
