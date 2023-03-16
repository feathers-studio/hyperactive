import { Tag } from "./lib/tags.ts";
import { EmptyElements } from "./lib/emptyElements.ts";
import { Attr } from "./lib/attributes.ts";
import { Falsy, isFalsy } from "./util.ts";
import State, { isState } from "./state.ts";

export type NonEmptyElement = Exclude<Tag, EmptyElements>;

export type HyperTextNode = string;

export class HyperHTMLStringNode {
	constructor(public htmlString: string) {}
}

type UnionKeys<T> = T extends unknown ? keyof T : never;
type AddOptionalKeys<K extends PropertyKey> = { readonly [P in K]?: never };

/**
 * We might not need this
 * // TODO(mkr): investigate and remove if unnecessary
 * @see https://millsp.github.io/ts-toolbelt/modules/union_strict.html
 */
type Deunionize<B extends object | undefined, T extends B = B> = T extends object
	? T & AddOptionalKeys<Exclude<UnionKeys<B>, keyof T>>
	: T;

export type HyperNode<T extends Tag = Tag> = {
	[T in Tag]: {
		tag: T;
		attrs: Attr<T>;
		children: (HyperNode<Tag> | HyperTextNode)[];
	};
}[T];

// TypeScript constructors cannot return custom types, including unions.
// Instead, we create a class expression and assert it to the correct constructor type which returns the HyperNode union.

export const HyperNode = class _HyperNode<T extends Tag> {
	constructor(public tag: T, public attrs: Attr<T>, public children: (HyperNode | HyperTextNode)[]) {}
} as new <T extends Tag = Tag>(tag: T, attrs: Attr<T>, children: (HyperNode | HyperTextNode)[]) => HyperNode<T>;

export type HyperNodeish<T extends Tag = Tag> =
	| HyperNode<T>
	| HyperTextNode
	| HyperHTMLStringNode
	| Falsy
	| State.Simple<HyperNode<T> | HyperTextNode | HyperHTMLStringNode | Falsy>
	| State.SimpleRO<HyperNode<T> | HyperTextNode | HyperHTMLStringNode | Falsy>;

// deno-lint-ignore no-explicit-any
export const isHyperNode = (n: any): n is HyperNode | HyperHTMLStringNode | HyperTextNode =>
	n instanceof HyperNode || n instanceof HyperHTMLStringNode || typeof n === "string";

export function normaliseParams<T extends Tag>(props?: Attr<T> | HyperNodeish, childNodes?: HyperNodeish[]) {
	const [attrs, children]: [Attr<T>, HyperNodeish[]] =
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
