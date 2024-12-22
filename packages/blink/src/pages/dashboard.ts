import {
	h1,
	body,
	head,
	html,
	link,
	title,
	input,
	form,
	button,
	ul,
	a,
	li,
	p,
	h3,
	code,
	table,
	thead,
	tr,
	th,
	tbody,
	td,
	i,
	nav,
	h2,
	hgroup,
	section,
} from "@hyperactive/hyper/elements";
import { renderHTML } from "@hyperactive/hyper";
import type { User } from "../types";
import { queries } from "../store";

export async function dashboard(request: Request, { user, url }: { user: User; url: URL }) {
	const error = url.searchParams.get("error");
	const _title = url.searchParams.get("title") ?? "";
	const _target = url.searchParams.get("target") ?? "";

	const created = url.searchParams.get("created");
	const created_link = created ? queries.links.get(created) : null;

	const page = Number(url.searchParams.get("page")) || 1;
	const limit = Number(url.searchParams.get("limit")) || 10;

	const listLinks = queries.links.list({ user_id: user.id, page, limit });
	const html_page = html(
		head(title("Blink"), link({ rel: "stylesheet", href: "/assets/style.css" })),
		body(
			{ class: "container" },
			nav(
				h1("Blink"),
				form(input({ class: "link", type: "submit", value: "Logout", formaction: "/logout", formmethod: "POST" })),
			),
			section(
				form(
					{ role: "group", action: "/links", method: "POST", enctype: "application/x-www-form-urlencoded" },
					input({ name: "title", type: "text", placeholder: "Title", value: _title }),
					input({ name: "target", type: "text", placeholder: "https://example.com", value: _target }),
					button("Submit"),
				),
				hgroup(
					error
						? p({ class: "muted" }, "Error: ", error)
						: created_link &&
								p(
									{ class: "muted" },
									"Link created: ",
									a({ href: "/" + created_link.slug }, url.host, "/", created_link.slug),
								),
				),
			),
			listLinks.length &&
				table(
					thead(tr(th("Title"), th("Short URL"), th("Target URL"), th("Visits"))),
					tbody(
						...listLinks.map(link =>
							tr(
								td(link.title || i("-")),
								td(a({ href: "/" + link.slug }, url.host, "/", link.slug)),
								td(a({ href: link.target }, link.target)),
								td(String(link.visits)),
							),
						),
					),
				),
		),
	);

	return new Response(renderHTML(html_page), { headers: { "Content-Type": "text/html" } });
}
