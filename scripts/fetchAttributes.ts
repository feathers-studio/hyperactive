import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.12-alpha/deno-dom-wasm.ts";

const html = await fetch(
	"https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes",
).then(res => res.text());

const document = new DOMParser().parseFromString(html, "text/html")!;

type Attribute = { attr: string; elements: string[] };

const groupByList = (xs: Attribute[]) =>
	xs.reduce((acc, curr) => {
		for (const element of curr.elements) {
			(acc[element] || (acc[element] = [])).push({
				attr: curr.attr,
				type: "string",
			});
		}

		return acc;
	}, {} as Record<string, { attr: string; type: string }[]>);

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
		.map(([, attr, , elements]) => ({
			attr: attr.trim(),
			elements: elements
				.replaceAll(/<|>/g, "")
				.split(/,\s+/)
				.map(e => e.trim()),
		}))
		.filter(each => each.attr !== "data-*")
		.sort((a, b) => a.attr.localeCompare(b.attr)),
);

const getKeyStr = (key: string) => (key.includes("-") ? `["${key}"]` : key);

const elementToType = (
	el: string,
	attrs: { attr: string; type: string }[],
	{ root }: { root?: boolean } = {},
) => {
	const indent = "\t".repeat(root ? 1 : 2);
	return [
		`${el}${root ? " =" : ":"} {`,
		indent +
			attrs
				.map(attr => `${getKeyStr(attr.attr)}: string;`)
				.join("\n" + indent),
		"\t".repeat(root ? 0 : 1) + "};",
	].join("\n");
};

const globalTypes = elementToType("GlobalAttrs", globalAttr, {
	root: true,
});

const elementTypes = Object.keys(elements)
	.sort((a, b) => a.localeCompare(b))
	.map(element => elementToType(element, elements[element]))
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
			role?: AriaRoles;
			aria?: AriaAttributes;
		} & ElementAttrs[E]
	>;
`;

Deno.writeTextFileSync("./src/attributes.ts", types);
