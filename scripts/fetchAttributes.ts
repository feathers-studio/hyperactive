import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.12-alpha/deno-dom-wasm.ts";

const html = await fetch(
	"https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes",
).then(res => res.text());

const document = new DOMParser().parseFromString(html, "text/html")!;

type Attribute = { attr: string; elements: string[]; desc: string };

const groupByList = (xs: Attribute[]) =>
	xs.reduce((acc, curr) => {
		for (const element of curr.elements) {
			(acc[element] || (acc[element] = [])).push({
				attr: curr.attr,
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
		.map(([, attr, , elements, , desc]) => ({
			attr: attr.trim(),
			elements: elements
				.replaceAll(/<|>/g, "")
				.split(/,\s+/)
				.map(e => e.trim()),
			desc: desc.trim(),
		}))
		.filter(each => each.attr !== "data-*")
		.sort((a, b) => a.attr.localeCompare(b.attr)),
);

const getKeyStr = (key: string) => (key.includes("-") ? `["${key}"]` : key);

const globalOrElems = (elements: string[]) =>
	elements.includes("Global attribute")
		? "Global attribute"
		: "Applies to " + elements.map(e => "`" + e + "`").join(", ");

const docLine = (line: string) => {
	line = line.trim();
	if (!line) return "";
	line = line.replace(
		/<|>/g,
		s => ({ "<": "`<", ">": ">`" }[s as "<" | ">"]),
	);
	if (line.startsWith("Note")) line = "> " + line;
	return " * " + line;
};

const getDesc = (attr: Attribute & { type: string }, indent: string) =>
	attr.desc &&
	indent +
		"/**\n" +
		indent +
		[globalOrElems(attr.elements)]
			.concat(attr.desc.replace("\n\n", "\n").split("\n"))
			.map(docLine)
			.filter(Boolean)
			.join("\n" + indent + " *\n" + indent) +
		("\n" + indent + " */\n");

const transformAttr =
	(indent: string) => (attr: Attribute & { type: string }) =>
		getDesc(attr, indent) + `${indent}${getKeyStr(attr.attr)}: string;`;

const elementToType = (
	el: string,
	attrs: (Attribute & { type: string })[],
	{ root }: { root?: boolean } = {},
) => {
	const indent = "\t".repeat(root ? 1 : 2);
	return [
		`${el}${root ? " =" : ":"} {`,
		attrs.map(transformAttr(indent)).join("\n"),
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
