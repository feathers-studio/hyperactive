import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.34-alpha/deno-dom-wasm.ts";
import { html2md } from "./html2md.ts";
import { preamble } from "./util/codegen.ts";
import { desc } from "./util/hypertyper.ts";

const html = await fetch("https://developer.mozilla.org/en-US/docs/Web/HTML/Element").then(res => res.text());
const document = new DOMParser().parseFromString(html, "text/html")!;

const tags = (
	[...document.querySelectorAll("section:not([aria-labelledby=obsolete_and_deprecated_elements]) tr")] as Element[]
).flatMap(x => {
	const y = x.children[0];
	const description = html2md(x.children[1].innerHTML, { baseURL: "https://developer.mozilla.org" });
	return [...y.querySelectorAll("a")].map(x => ({ title: x.textContent.replace(/<|>/g, ""), description }));
});

Deno.writeTextFileSync(
	"./hyper/lib/tags.ts",
	[
		preamble,
		"export type CustomTag = `${string}-${string}`;",
		"export type Tag =\n" +
			["CustomTag"]
				.concat(
					tags
						.map(x => x.title)
						.sort((a, b) => a.localeCompare(b))
						.map(title => `"${title}"`),
				)
				.map(x => `\t| ${x}`)
				.join("\n") +
			";\n",
	].join("\n\n"),
);

Deno.writeTextFileSync(
	"./hyper/elements.ts",
	[
		preamble,
		`import { elements } from "./element.ts"`,
		...tags
			// why does this exist? <var> won't be supported via import syntax
			.filter(x => x.title !== "var")
			.map(({ title, description }) =>
				[[...desc(description)].join(""), `export const ${title} = elements.${title};`].join(""),
			),
	].join("\n\n"),
);
