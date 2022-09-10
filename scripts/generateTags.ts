import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.12-alpha/deno-dom-wasm.ts";
import { preamble } from "./util/codegen.ts";

const html = await fetch("https://developer.mozilla.org/en-US/docs/Web/HTML/Element").then(res => res.text());
const document = new DOMParser().parseFromString(html, "text/html")!;

const baseType =
	"export type CustomTag = `${string}-${string}`;\n\n" +
	`export type Tag =
	| CustomTag`;

const constructTypes = (elements: string[]) => {
	return (
		baseType +
		"\n\t| " +
		elements
			.sort((a, b) => a.localeCompare(b))
			.map(title => `"${title}"`)
			.join("\n\t| ") +
		";\n"
	);
};

Deno.writeTextFileSync(
	"./hyper/lib/tags.ts",
	[
		preamble,
		constructTypes(
			[
				...document.querySelectorAll(
					"section:not([aria-labelledby=obsolete_and_deprecated_elements]) tr > td:first-child a",
				),
			].map(x => x.textContent.replace(/<|>/g, "")),
		),
	].join("\n"),
);
