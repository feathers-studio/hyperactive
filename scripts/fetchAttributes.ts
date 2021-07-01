import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.12-alpha/deno-dom-wasm.ts";

import { propsToType } from "./codegen.ts";

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

const globalOrElems = (elements: string[]) =>
	elements.includes("Global attribute")
		? "Global attribute"
		: "Applies to " + elements.map(e => "`" + e + "`").join(", ");

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
				desc: [globalOrElems(elements), desc.trim()].join("\n"),
			};
		})
		.filter(each => each.prop !== "data-*")
		.sort((a, b) => a.prop.localeCompare(b.prop)),
);

const globalTypes = propsToType("GlobalAttrs", globalAttr, {
	root: true,
});

const elementTypes = Object.keys(elements)
	.sort((a, b) => a.localeCompare(b))
	.map(element => propsToType(element, elements[element]))
	.join("\n\t");

const types = `import { Element } from "./elements.ts";
import { AriaRoles, AriaAttributes } from "./aria.ts";

type ${globalTypes}

type ElementAttrs = {
	${elementTypes}
	[k: string]: unknown;
};

export type DataAttr = ${"`data-${string}`"};

export type Attr<E extends Element = Element> =
	// TODO(mkr): will work in TS 4.4
	// { [data in DataAttr]?: string }
	Partial<
		GlobalAttrs & {
			/**
			 * When the element lacks suitable ARIA-semantics, authors must
			 * assign an ARIA-role. Addition of ARIA semantics only exposes
			 * extra information to a browser's accessibility API, and does
			 * not affect a page's DOM.
			 * 
			 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques
			 */
			role?: AriaRoles;
			/**
			 * ARIA is a set of attributes that define ways to make web content
			 * and web applications (especially those developed with JavaScript)
			 * more accessible to people with disabilities.
			 * 
			 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA
			 */
			aria?: AriaAttributes;
		} & ElementAttrs[E]
	>;
`;

Deno.writeTextFileSync("./src/attributes.ts", types);
