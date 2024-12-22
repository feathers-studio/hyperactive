import { h1, body, head, html, link, title, input, form, hgroup, p } from "@hyperactive/hyper/elements";
import { renderHTML } from "@hyperactive/hyper";
import { queries } from "../store";
import { parse as cookie } from "cookie";

const day = 1000 * 60 * 60 * 24;

const redirect = (url: string, headers: Record<string, string> = {}) =>
	new Response(null, { status: 302, headers: { Location: url, ...headers } });

export async function login(request: Request, { ip }: { ip: string | null }) {
	const body = await request.formData();
	const username = body.get("username")?.toString();
	const password = body.get("password")?.toString();

	if (!username || !password) return new Response("Invalid username or password", { status: 401 });

	const result = queries.users.get(username);
	if (!result) return redirect("/?error=Invalid username or password");

	if (!(await Bun.password.verify(password, result.password))) return redirect("/?error=Invalid username or password");

	const session = queries.sessions.create({
		token: crypto.randomUUID(),
		username: result.username,
		ip_address: ip,
		user_agent: request.headers.get("user-agent"),
		expires_at: new Date(Date.now() + day * 30).toISOString(),
	});

	if (!session) return redirect("/?error=Failed to create session");

	return redirect("/", {
		"Set-Cookie": `token=${session.token}; Max-Age=${day * 30}; HttpOnly; Secure; SameSite=Strict`,
	});
}

export async function logout(request: Request) {
	const token = cookie(request.headers.get("cookie") ?? "").token;
	if (!token) return redirect("/?error=No token");

	const changes = await queries.sessions.logout(token);

	if (!changes.changes) return redirect("/?error=Could not find active session");

	return redirect("/", {
		"Set-Cookie": `token=; Max-Age=0; HttpOnly; Secure; SameSite=Strict`,
	});
}

export async function loginPage(request: Request, { url }: { url: URL }) {
	const error = url.searchParams.get("error");

	const html_page = html(
		head(title("Blink"), link({ rel: "stylesheet", href: "/assets/style.css" })),
		body(
			{ class: "container" },
			h1("Blink"),
			form(
				{ action: "/login", method: "POST", enctype: "application/x-www-form-urlencoded" },
				input({ name: "username", type: "text", placeholder: "Username" }),
				input({ name: "password", type: "password", placeholder: "Password" }),
				input({ type: "submit", value: "Login" }),
			),
		),
		hgroup(error && p({ class: "muted" }, "Error: ", error)),
	);

	return new Response(renderHTML(html_page), { headers: { "Content-Type": "text/html" } });
}
