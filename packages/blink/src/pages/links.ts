import { a, body, head, link, meta, noscript, p } from "@hyperactive/hyper/elements";
import { customAlphabet } from "nanoid";
import { queries } from "../store";
import type { User } from "../types";
import { html, fetchMeta, generateMeta, redirect, type Meta } from "../utils";

const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz_-";
const nanoid = customAlphabet(alphabet, 8);

export async function POST(request: Request, { user }: { user: User }) {
	const formData = await request.formData();
	const title = formData.get("title")?.toString();
	let target = formData.get("target")?.toString();

	if (!target) return redirect("/", {}, { error: "Target is required", title });

	let meta: Meta | null = null;

	try {
		const url = new URL(target);
		target = url.toString();
		meta = await fetchMeta(target);
	} catch (error) {
		return redirect("/", {}, { error: "Invalid target URL", title, target });
	}

	let slug: string;
	let attempts = 0;
	while (queries.links.get((slug = nanoid()))) {
		attempts++;
		if (attempts > 100) return redirect("/", {}, { error: "Failed to generate unique slug", title, target });
	}

	if (title) meta.title = title;

	queries.links.create({ ...meta, target, slug, user_id: user.id });

	return redirect("/", {}, { created: slug });
}

export async function GET(request: Request, { url, ip }: { url: URL; ip: string | null }) {
	const slug = url.pathname.slice(1);

	const l = queries.links.get(slug);
	if (!l) return new Response("Link not found", { status: 404 });

	const user_agent = request.headers.get("user-agent");
	queries.visits.create({ link_id: l.id, ip_address: ip, user_agent });

	const tags = generateMeta(l, "https://" + url.host);

	return html(
		// @ts-expect-error "prefix" is not a valid prop, but og protocol uses it
		{ prefix: "http://ogp.me/ns#" },
		head(
			link({ rel: "icon", type: "image/png", href: "/assets/img/favicon-96x96.png", sizes: "96x96" }),
			link({ rel: "shortcut icon", href: "/assets/img/favicon.ico" }),
			...tags,
			meta({ "http-equiv": "refresh", "content": `0; url=${l.target}` }),
		),
		body(
			p("Redirecting you to ", a({ href: l.target }, l.target)),
			// script(`window.location.href = ${JSON.stringify(l.target)};`),
			noscript("If you are not redirected automatically, please ", a({ href: l.target }, "click here")),
		),
	)();
}
