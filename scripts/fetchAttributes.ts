import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.12-alpha/deno-dom-wasm.ts";

import { preamble, propsToType } from "./util/codegen.ts";
import { getSplType } from "./util/getSplType.ts";

const html = await fetch(
	"https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes",
).then(res => res.text());

const document = new DOMParser().parseFromString(html, "text/html")!;

type Attribute = { prop: string; elements: string[]; desc: string };

const groupByList = (xs: Attribute[]) =>
	xs.reduce((acc, curr) => {
		for (const element of curr.elements) {
			(acc[element] || (acc[element] = [])).push({
				prop: curr.prop,
				elements: curr.elements,
				type: "string",
				desc: curr.desc,
			});
		}

		return acc;
	}, {} as Record<string, (Attribute & { type: string })[]>);

const { "Global attribute": globalAttr, ...elements } = groupByList(
	[
		...document.querySelector("article table.standard-table tbody")
			?.childNodes!,
	]
		.filter(tr => tr.nodeName === "TR")
		.filter(
			tr =>
				// @ts-ignore: innerHTML exists, but isn't typed
				!(tr.innerHTML as string).includes(`"icon icon-deprecated"`),
		)
		.map(tr => [...tr.childNodes!].map(each => each.textContent))
		.map(([, attr, , elems, , desc]) => {
			const elements = elems
				.replaceAll(/<|>/g, "")
				.split(/,\s+/)
				.map(e => e.trim());

			return {
				prop: attr.trim(),
				elements,
				desc: desc.trim(),
			};
		})
		.filter(each => each.prop !== "data-*")
		.sort((a, b) => a.prop.localeCompare(b.prop)),
);

const customDesc: Record<string, string | undefined> = {
	height: "Specifies the height of the element.",
	width: "Specifies the width of the element.",
};

const composeCustom = (attr: Attribute & { type: string }, element?: string) =>
	Object.assign(attr, {
		desc: customDesc[attr.prop] || attr.desc,
		type: getSplType(attr.prop)(element || "global") || "string",
	});

const globalTypes = propsToType(
	"GlobalAttrs",
	globalAttr.map(attr => composeCustom(attr)),
	{ root: true },
);

const elementTypes = Object.keys(elements)
	.sort((a, b) => a.localeCompare(b))
	.map(element =>
		propsToType(
			element,
			elements[element].map(attr => composeCustom(attr, element)),
		),
	)
	.join("\n\t");

const types = `${preamble}
import { Element } from "./elements.ts";
import { AriaRoles, AriaAttributes } from "./aria.ts";
import { HTMLElement, DOMEvents } from "./dom.ts";

type ${globalTypes}

type ElementAttrs = {
	${elementTypes}
};

type PropOr<T, P extends string | symbol | number, D> =
	T extends Record<P, infer V> ? V : D;

type Deunionize<T> =
	| ([undefined] extends [T] ? undefined : never)
	| { [K in T extends unknown ? keyof T : never]: PropOr<NonNullable<T>, K, undefined>; };

export type AllAttrs = Partial<Deunionize<ElementAttrs[keyof ElementAttrs]>>;

export type DataAttr = ${"`data-${string}`"};

type MappedId<T> = {} & { [P in keyof T]: T[P] };

export type Attr<E extends Element = Element> =
	// TODO(mkr): will work in TS 4.4
	// { [data in DataAttr]?: string }
	MappedId<Partial<
		GlobalAttrs & {
			/**
			 * ref callback is called on mount of element with the DOM element.
			 */
			ref: (el: HTMLElement) => void,
			/**
			 * When the element lacks suitable ARIA-semantics, authors must
			 * assign an ARIA-role. Addition of ARIA semantics only exposes
			 * extra information to a browser's accessibility API, and does
			 * not affect a page's DOM.
			 * 
			 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques
			 */
			role: AriaRoles;
			/**
			 * ARIA is a set of attributes that define ways to make web content
			 * and web applications (especially those developed with JavaScript)
			 * more accessible to people with disabilities.
			 * 
			 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA
			 */
			aria: AriaAttributes;
		} & (ElementAttrs & { [k: string]: unknown })[E] & DOMEvents
	>>;
`;

Deno.writeTextFileSync("./src/lib/attributes.ts", types);
