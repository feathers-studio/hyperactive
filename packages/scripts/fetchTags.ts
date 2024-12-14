import { JSDOM } from "jsdom";
import { html2md } from "./util/html2md.ts";
import * as typer from "./util/hypertyper.ts";

export async function* fetchTags() {
	const html = await fetch("https://developer.mozilla.org/en-US/docs/Web/HTML/Element").then(res => res.text());
	const { document } = new JSDOM(html).window;

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
				return { title: x.textContent!.replace(/<|>/g, ""), href, description };
			});
		})
		.sort((a, b) => a.title.localeCompare(b.title));

	{
		const custom = typer.statement(typer.exports(typer.type("CustomTag", "`${string}-${string}`")));
		const tag = typer.statement(
			typer.exports(typer.type("Tag", typer.union(["CustomTag"].concat(tags.map(x => `"${x.title}"`))))),
		);

		yield {
			file: "tags.ts",
			*content() {
				yield typer.preamble;
				yield "\n\n";
				yield* custom;
				yield "\n\n";
				yield* tag;
			},
		};
	}

	{
		// why does <var> even exist? Won't be supported via import syntax because it's a reserved keyword
		const types = typer.flatMap(
			tags.filter(tag => tag.title !== "var"),
			function* (opts) {
				yield* (function* ({ title, href, description }: typeof opts) {
					yield "\n\n";
					yield* typer.desc([description, typer.see(baseURL + href, "MDN | " + title)].join("\n\n"));
					yield* typer.statement(typer.exports(typer.constant(title, `elements.${title}`)));
				})(opts);
			},
		);

		yield {
			file: "../elements.ts",
			*content() {
				yield typer.preamble;
				yield "\n\n";
				yield* typer.imports("./element.ts", { imports: ["elements"] });
				yield* types;
			},
		};
	}
}
