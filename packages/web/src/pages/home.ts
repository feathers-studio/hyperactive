import { join } from "node:path";
import { List, trust } from "@hyperactive/hyper";
import { a, article, br, div, h1, header, main, p, section, span } from "@hyperactive/hyper/elements";
import { marked } from "marked";

const logo = trust(await Bun.file(join(import.meta.dir, "../../../../docs/h(⚡️).svg")).text());

const docs = join(import.meta.dir, "../content/docs.md");

export async function Home() {
	const content = trust(await marked.parse(await Bun.file(docs).text()));

	return new List([
		section.container.hero(
			header(
				span.logo(logo),
				div.marker("beta", span.tooltip("Expect bugs!", br(), "These docs are a work in progress!")),
			),
			main(
				h1.text_gradient("Hyperactive"),
				p("is a powerful toolbox for web application development"),
				a.button({ href: "#docs" }, "Get Started"),
			),
		),
		section.container["#docs"](article(content)),
	]);
}
