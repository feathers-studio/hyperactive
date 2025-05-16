import { h, HyperNode, normaliseParams } from "./node.ts";
import { parseSelector } from "./parse.ts";
import { isNonNullable, MaybeString } from "./util.ts";
import type { HyperNodeish, NonEmptyElement } from "./node.ts";
import type { Tag } from "./lib/tags.ts";
import type { EmptyElements } from "./lib/emptyElements.ts";
import type { Attributes } from "./attributes.ts";
import { ReadonlyState, State } from "./state.ts";

export namespace Hyper {
	export interface Empty<T extends Tag> {
		// no children for empty tags
		(props?: Attributes<T>): HyperNode<T>;
		[selector: string]: Hyper.Empty<T>;
	}

	export interface Base<T extends Tag> {
		(props: Attributes<T>): HyperNode<T>;
		(...childNodes: HyperNodeish[]): HyperNode<T>;
		(props: Attributes<T>, ...childNodes: HyperNodeish[]): HyperNode<T>;
		[selector: string]: Hyper.Base<T>;
	}

	export type Element<T extends Tag = Tag> = T extends EmptyElements ? Hyper.Empty<T> : Hyper.Base<T>;
}

export type Elements = { [k in Tag]: Hyper.Element<k> };

function createSelectorProxy<T extends Tag>(
	element: T,
	hyperElement: Hyper.Element<T>,
	loaded?: string,
): Hyper.Element<T> {
	type hE = Hyper.Element<T>;

	return new Proxy(hyperElement, {
		// Do NOT cache the target _ like we do below in elements,
		// because if users use this feature a lot, it'll leak memory
		// Just let elements.a.hello be a new function every time
		// and elements.a.hello !== elements.a.hello
		// It's okay -- don't fret about it
		get(_: hE, selector: string) {
			const parsed = parseSelector([loaded, selector].filter(Boolean).join(" "));

			const hyperElement = function hyperElement(
				props?: Attributes<T> | HyperNodeish,
				...childNodes: HyperNodeish[]
			) {
				const { attrs, children } = normaliseParams(props, childNodes);

				const className = new State<MaybeString | MaybeString[]>("");

				if (ReadonlyState.isState(attrs.class)) {
					className.set(attrs.class.value);
					attrs.class.pipe(className);
				} else className.set(attrs.class);

				if (parsed.class) className.setWith(c => [parsed.class, c].flatMap(x => (x ? x : [])).filter(Boolean));

				const merged = { ...attrs, id: parsed.id || attrs.id, class: className };

				return new HyperNode(element, merged, children.filter(isNonNullable));
			} as hE;

			return createSelectorProxy(element, hyperElement, selector);
		},
	});
}

export function create<T extends Tag>(element: T) {
	const hyperElement = function hyperElement(...params: any[]) {
		return h(element as NonEmptyElement, ...params);
	} as Elements[T];

	return /* @__PURE__ */ createSelectorProxy<T>(element, hyperElement);
}
