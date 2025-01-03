import { renderHTML, type HyperNodeish } from "@hyperactive/hyper";
import { body, head, html, link, meta, script, title as title_tag } from "@hyperactive/hyper/elements";

export function Layout(title: string, style = "/assets/style.css") {
	return function (children: HyperNodeish) {
		return renderHTML(
			html(
				head(
					meta({ charset: "utf-8" }),
					meta({ name: "viewport", content: "width=device-width, initial-scale=1.0" }),
					title_tag(title),
					link({ rel: "stylesheet", href: style }),
				),
				body(children, script({ src: "/assets/prism/prism.js" })),
			),
		);
	};
}
