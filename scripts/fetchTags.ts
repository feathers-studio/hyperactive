import { DOMParser, Element, HTMLCollection } from "https://deno.land/x/deno_dom@v0.1.36-alpha/deno-dom-wasm.ts";
import { html2md } from "./util/html2md.ts";
import * as typer from "./util/hypertyper.ts";

const html = await fetch("https://developer.mozilla.org/en-US/docs/Web/HTML/Element").then(res => res.text());
const document = new DOMParser().parseFromString(html, "text/html")!;

const baseURL = "https://developer.mozilla.org";

const tags = (
	[...document.querySelectorAll("section:not([aria-labelledby=obsolete_and_deprecated_elements]) tr")] as Element[]
)
	.flatMap(x => {
		const y = x.children[0];
		const description = html2md(x.children[1].innerHTML, { baseURL });
		return [...(y.querySelectorAll("a") as unknown as HTMLCollection)].map(x => {
			let href = "";
			for (const attr of x.attributes) if (attr.nodeName === "href") href = attr.value;
			return { title: x.textContent.replace(/<|>/g, ""), href, description };
		});
	})
	.sort((a, b) => a.title.localeCompare(b.title));

{
	const custom = typer.statement(typer.exports(typer.type("CustomTag", "`${string}-${string}")));
	const tag = typer.union(["CustomTag"].concat(tags.map(x => `"${x.title}"`)));
	const program = typer.program(typer.preamble, custom, tag);

	const target = "./hyper/elements.ts";
	console.log(`Writing ${target}`);
	await typer.writer(target, program);
}

{
	// why does <var> even exist? Won't be supported via import syntax because it's a reserved keyword
	const types = typer.flatMap(
		tags.filter(tag => tag.title !== "var"),
		function* (opts) {
			yield typer.collectString(
				(function* ({ title, href, description }: typeof opts) {
					yield* typer.desc([description, typer.see(baseURL + href, "MDN | " + title)].join("\n\n"));
					yield* typer.statement(typer.exports(typer.constant(title, `elements.${title}`)));
				})(opts),
			);
		},
	);

	const program = typer.program(typer.preamble, typer.imports("./element.ts", { imports: ["elements"] }), ...types);

	const target = "./hyper/elements.ts";
	console.log(`Writing ${target}`);
	await typer.writer(target, program);
}
