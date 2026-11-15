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
	| number
	| bigint
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
	// Without these, `h("p", 42)` took 42 for an attributes object and dropped it.
	typeof n === "number" ||
	typeof n === "bigint" ||
	Array.isArray(n) ||
	ReadonlyState.isState(n) ||
	List.isList(n);

// `list.length && x` has the type `0 | X`, because TypeScript narrows a falsy number to the literal 0.
// Numbers render, so that child shows "0" when the list is empty. A `number` or `number | undefined`
// is a value, not this shape, and stays allowed.
type Zero<C> =
	| (0 extends C ? (number extends C ? never : 0) : never)
	| (0n extends C ? (bigint extends C ? never : 0n) : never);

type RendersZero<C> = [Zero<C>] extends [never]
	? false
	: [Exclude<C, number | bigint | Falsy>] extends [never]
		? false
		: true;

// The check reaches one level into a state, a list or an array: `count.to(c => c && x)` and
// `[list.length && x]` have the same shape.
type Contents<C> =
	C extends ReadonlyState<infer U>
		? U
		: C extends ReadonlyList<infer U>
			? U
			: C extends List<infer U>
				? U
				: C extends readonly (infer U)[]
					? U
					: C;

type Child<C> =
	RendersZero<Contents<C>> extends true
		? "`n && x` renders 0 when n is 0; write `n > 0 && x` or `n ? x : null`"
		: C;

/** The children `C`, with any child that renders "0" from `n && x` rejected. */
export type Children<C extends readonly unknown[]> = { [K in keyof C]: Child<C[K]> };

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

export function h<Tag extends NonEmptyElement, C extends HyperNodeish[]>(
	elem: Tag,
	...children: Children<C>
): HyperNode<Tag>;

export function h<Tag extends NonEmptyElement, Attrs extends Attributes<Tag>, C extends HyperNodeish[]>(
	elem: Tag,
	props: Attrs,
	...children: Children<C>
): HyperNode<Tag>;

export function h<
	Tag extends NonEmptyElement,
	Attrs extends Attributes<Tag>,
	P extends Attrs | HyperNodeish,
	C extends HyperNodeish[],
>(elem: Tag, props?: Child<P>, ...children: Children<C>): HyperNode<Tag>;

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
