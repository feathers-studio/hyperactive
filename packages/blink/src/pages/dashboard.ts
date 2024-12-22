import { parse as cookie } from "cookie";
import {
	a,
	body,
	button,
	form,
	h1,
	head,
	hgroup,
	i,
	input,
	link,
	meta,
	nav,
	p,
	section,
	table,
	tbody,
	td,
	th,
	thead,
	title,
	tr,
} from "@hyperactive/hyper/elements";
import { queries } from "../store";
import type { User } from "../types";
import { html, days } from "../utils";

export async function dashboard(request: Request, { user, url }: { user: User; url: URL }) {
	const error = url.searchParams.get("error");
	const _title = url.searchParams.get("title") ?? "";
	const _target = url.searchParams.get("target") ?? "";

	const created = url.searchParams.get("created");
	const created_link = created ? queries.links.get(created) : null;

	const page = Number(url.searchParams.get("page")) || 1;
	const limit = Number(url.searchParams.get("limit")) || 10;

	const listLinks = queries.links.list({ user_id: user.id, page, limit });

	const session = cookie(request.headers.get("cookie") ?? "").token;

	return html(
		{},
		head(
			title("Blink"),
			meta({ name: "viewport", content: "width=device-width, initial-scale=1" }),
			link({ rel: "icon", type: "image/png", href: "/assets/img/favicon-96x96.png", sizes: "96x96" }),
			link({ rel: "shortcut icon", href: "/assets/img/favicon.ico" }),
			link({ rel: "stylesheet", href: "/assets/style.css" }),
		),
		body(
			{ class: "container" },
			nav(
				h1(a({ href: "/" }, "Blink")),
				form(input({ class: "link", type: "submit", value: "Logout", formaction: "/logout", formmethod: "POST" })),
			),
			section(
				form(
					{ role: "group", action: "/links", method: "POST", enctype: "application/x-www-form-urlencoded" },
					input({ name: "target", type: "text", placeholder: "https://example.com", value: _target }),
					input({ name: "title", type: "text", placeholder: "Title (optional)", value: _title }),
					button("Shorten!"),
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
								td(p(link.title || i("-"))),
								td(
									a({ href: "/" + link.slug, target: "_blank", rel: "noopener noreferrer" }, url.host, "/", link.slug),
								),
								td(a({ href: link.target, target: "_blank", rel: "noopener noreferrer" }, link.target)),
								td(String(link.visits)),
							),
						),
					),
				),
		),
	)({
		// Refresh Cookie expires every time the page is loaded
		"Set-Cookie": `token=${session}; Max-Age=${days(30)}; HttpOnly; Secure; SameSite=Strict`,
	});
}
