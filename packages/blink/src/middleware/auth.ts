import { parse as cookie } from "cookie";
import { queries } from "../store";
import type { User } from "../types";

export async function authenticate(request: Request): Promise<User | Response> {
	const token = cookie(request.headers.get("cookie") ?? "").token;
	if (!token) return new Response("Unauthorized", { status: 401 });

	const session = queries.sessions.access(token);
	if (!session) return new Response("Unauthorized", { status: 401 });

	const user = queries.users.get(session.username);
	if (!user) return new Response("Unknown user", { status: 401 });

	return user;
}
