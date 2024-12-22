import { body, form, h1, head, hgroup, input, link, p, title } from "@hyperactive/hyper/elements";
import { parse as cookie } from "cookie";
import { queries } from "../store";
import { days, generateMeta, html, json, redirectClear } from "../utils";

interface LoginParams {
	ip: string | null;
	withJSON: boolean;
}

export async function login(request: Request, { ip, withJSON }: LoginParams) {
	const body = await request.formData();
	const username = body.get("username")?.toString();
	const password = body.get("password")?.toString();

	if (!username || !password) {
		if (withJSON) return json({ error: "Invalid username or password" }, 401);
		return new Response("Invalid username or password", { status: 401 });
	}

	const result = queries.users.getByUsername(username);
	if (!result) {
		if (withJSON) return json({ error: "Invalid username or password" }, 401);
		return redirectClear("/?error=Invalid username or password");
	}

	if (!(await Bun.password.verify(password, result.password))) {
		if (withJSON) return json({ error: "Invalid username or password" }, 401);
		return redirectClear("/?error=Invalid username or password");
	}

	const session = queries.sessions.create({
		token: crypto.randomUUID(),
		user_id: result.id,
		ip_address: ip,
		user_agent: request.headers.get("user-agent"),
		expires_at: new Date(Date.now() + days(30) * 1000).toISOString(),
	});

	if (!session) {
		if (withJSON) return json({ error: "Failed to create session" }, 500);
		return redirectClear("/?error=Failed to create session");
	}

	if (withJSON) return json({ token: session.token, expires_at: session.expires_at }, 200);
	return redirectClear("/", {
		"Set-Cookie": `token=${session.token}; Max-Age=${days(30)}; HttpOnly; Secure; SameSite=Strict`,
	});
}

interface LogoutParams {
	withJSON: boolean;
}

export async function logout(request: Request, { withJSON }: LogoutParams) {
	const token = cookie(request.headers.get("cookie") ?? "").token;
	if (!token) {
		if (withJSON) return json({ error: "No token" }, 401);
		return redirectClear("/?error=No token");
	}

	const changes = await queries.sessions.logout(token);

	if (!changes.changes) {
		if (withJSON) return json({ error: "Could not find active session" }, 401);
		return redirectClear("/?error=Could not find active session");
	}

	if (withJSON) return json({}, 200);
	return redirectClear("/", {
		"Set-Cookie": `token=; Max-Age=0; HttpOnly; Secure; SameSite=Strict`,
	});
}

export async function loginPage(request: Request, { url }: { url: URL }) {
	const error = url.searchParams.get("error");

	return html(
		// @ts-expect-error "prefix" is not a valid prop, but og protocol uses it
		{ prefix: "http://ogp.me/ns#" },
		head(
			title("Blink"),
			link({ rel: "icon", type: "image/png", href: "/assets/img/favicon-96x96.png", sizes: "96x96" }),
			link({ rel: "shortcut icon", href: "/assets/img/favicon.ico" }),
			link({ rel: "stylesheet", href: "/assets/style.css" }),
			...generateMeta({ title: "Blink", description: "Shorten links using Blink" }, url.protocol + "//" + url.host),
		),
		body(
			{ class: "container" },
			h1("Blink"),
			form(
				{ action: "/login", method: "POST", enctype: "application/x-www-form-urlencoded" },
				input({ name: "username", type: "text", placeholder: "Username" }),
				input({ name: "password", type: "password", placeholder: "Password" }),
				input({ type: "submit", value: "Login" }),
			),
			hgroup(error && p({ class: "muted" }, "Error: ", error)),
		),
	)();
}
