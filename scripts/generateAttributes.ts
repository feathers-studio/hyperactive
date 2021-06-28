import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.12-alpha/deno-dom-wasm.ts";

const html = await fetch(
	"https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes",
).then(res => res.text());

const document = new DOMParser().parseFromString(html, "text/html");

const attrs = [
	...document?.querySelector("article table.standard-table tbody")
		?.childNodes!,
]
	.filter(tr => tr.nodeName === "TR")
	// .filter((_, i) => i <= 2) // limit to 3 elements
	.map(tr => [...tr.childNodes!].map(each => each.textContent))
	.map(([, attr, , elements]) => ({
		attr: attr.trim(),
		elements: elements.replaceAll(/<|>/g, "").split(/,\s+/),
	}))
	.filter(each => each.attr !== "data-*");

const prelude = "type DataAttr = `data-${string}`;\n\n";

const prologue = `
export type Attr =
	// TODO(mkr): will work in TS 4.4
	// { [data in DataAttr]?: string } &
	Partial<Record<AttrKeys, string>>;
`;

// TODO(mkr): group by element
Deno.writeTextFileSync(
	"./src/attrs.ts",
	prelude +
		"type AttrKeys =\n\t| " +
		attrs.map(each => `"${each.attr}"`).join("\n\t| ") +
		";\n" +
		prologue,
);
