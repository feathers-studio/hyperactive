import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.12-alpha/deno-dom-wasm.ts";

import { getSpecialType } from "./util/getSpecialType.ts";
import * as typer from "./util/hypertyper.ts";

const html = await fetch("https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes").then(res => res.text());
const document = new DOMParser().parseFromString(html, "text/html")!;

type Attribute = { prop: string; elements: string[]; desc: string; type: string };

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
	}, {} as Record<string, Attribute[]>);

const { "Global attribute": globalAttr, ...elements } = groupByList(
	[...document.querySelector("article table.standard-table tbody")?.childNodes!]
		.filter(tr => tr.nodeName === "TR")
		.filter(
			tr =>
				// @ts-expect-error: innerHTML exists, but isn't typed
				!(tr.innerHTML as string).includes(`"icon icon-deprecated"`),
		)
		.map(tr => [...tr.children])
		.map(([attr, elems, description]) => {
			const elements = elems.textContent
				.replaceAll(/<|>/g, "")
				.split(/,\s+/)
				.map(e => e.trim());

			const prop = attr.children[0].textContent.trim();
			const isExp = attr.children[1]?.classList.contains("icon-experimental");

			const desc =
				description.textContent
					.trim()
					.split("\n")
					.map(x => x.trim())
					.join("\n")
					.replace("\n\n", "\n") + (isExp ? "\n\n@experimental" : "");

			// type will be replaced later
			return { type: "", prop, elements, desc };
		})
		.filter(each => each.prop !== "data-*")
		.sort((a, b) => a.prop.localeCompare(b.prop)),
);

const customDesc: Record<string, string> = {
	height: "Specifies the height of the element.",
	width: "Specifies the width of the element.",
};

const composeCustom = (attr: Attribute, element?: string) => ({
	prop: attr.prop,
	desc: customDesc[attr.prop] || attr.desc,
	type: getSpecialType(attr.prop)(element || "global") || "string",
});

// moved to fetchGlobalAttributes.ts
// const globalType = typer.iface("GlobalAttrs", typer.struct(globalAttr.map(attr => composeCustom(attr))));

const capitalise = (name: string) => name[0].toUpperCase() + name.slice(1);
const toElementAttrType = (name: string) => capitalise(name) + "Attributes";

function* elementTypes() {
	const sorted = Object.keys(elements).sort((a, b) => a.localeCompare(b));
	for (const element of sorted) {
		yield typer.statement(
			typer.iface(
				toElementAttrType(element),
				typer.struct(elements[element].map(attr => composeCustom(attr, element))),
			),
		);
	}

	yield typer.statement(
		typer.iface(
			"UniqueElementAttrs",
			typer.struct(
				sorted
					.map((element): typer.Prop => ({ prop: element, type: toElementAttrType(element) }))
					.concat([{ prop: "[k: string]", type: "unknown", noSmartKey: true }]),
			),
		),
	);
}

const preamble = "// This file was generated by hypertyper. Do not manually edit this file.";

const imports = [
	`import { Tag } from "./tags.ts";`,
	`import { GlobalAttrs } from "./global-attributes.ts";`,
	`import { AriaRoles, AriaAttributes } from "./aria.ts";`,
	`import { HTMLElement, DOMEvents, HTMLElementTagNameMap } from "./dom.ts";`,
].join("\n");

const prologue = `

type PropOr<T, P extends string | symbol | number, D> = T extends Record<P, infer V> ? V : D;

type Deunionise<T> =
	| ([undefined] extends [T] ? undefined : never)
	| { [K in T extends unknown ? keyof T : never]: PropOr<NonNullable<T>, K, undefined> };

export type AllAttrs = Partial<Deunionise<UniqueElementAttrs[keyof UniqueElementAttrs]>>;

export type DataAttr = { [data in \`data-\${string}\`]?: string };

type TagToHTMLElement<T extends Tag> = T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement;

interface Common<T extends Tag> {
	/**
	 * ref callback is called on mount of element with the DOM element.
	 */
	ref: (el: TagToHTMLElement<T>) => void;
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
}

export type Attr<T extends Tag = Tag> = Partial<GlobalAttrs & DataAttr & Common<T> & UniqueElementAttrs[T] & DOMEvents>;
`.trim();

{
	const target = "./hyper/lib/attributes.ts";
	console.log(`Writing ${target}`);
	typer.writer(target, typer.program(preamble, imports, ...elementTypes(), prologue));
}
