import type { User } from "../types";
import { queries } from "../store";
import { customAlphabet } from "nanoid";
import { redirect } from "../utils";

const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz_-";
const nanoid = customAlphabet(alphabet, 8);

export async function POST(request: Request, { user }: { user: User }) {
	const formData = await request.formData();
	const title = formData.get("title")?.toString();
	let target = formData.get("target")?.toString();

	if (!target) return redirect(`/?title=${title}&target=${target}&error=Target is required`);

	try {
		const url = new URL(target);
		target = url.toString();
	} catch (error) {
		return redirect(`/?title=${title}&target=${target}&error=Invalid target URL`);
	}

	let slug: string;
	let attempts = 0;
	while (queries.links.get((slug = nanoid()))) {
		attempts++;
		if (attempts > 100) return redirect("/?error=Failed to generate unique slug");
	}

	queries.links.create({ title, target, slug, user_id: user.id });

	return new Response("Link created", { status: 302, headers: { Location: `/?created=${slug}` } });
}

export async function GET(request: Request, { url, ip }: { url: URL; ip: string | null }) {
	const slug = url.pathname.slice(1);

	const link = queries.links.get(slug);
	if (!link) return new Response("Link not found", { status: 404 });

	const user_agent = request.headers.get("user-agent");
	queries.visits.create({ link_id: link.id, ip_address: ip, user_agent });

	return new Response(null, { status: 302, headers: { Location: link.target } });
}
