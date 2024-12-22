import { parse as cookie } from "cookie";
import { queries } from "../store";
import type { User } from "../types";
import { redirect } from "../utils";

export async function authenticate(request: Request): Promise<User | Response> {
	const token = cookie(request.headers.get("cookie") ?? "").token;
	if (!token) return redirect("/?error=Your session has expired, please login again");

	const session = queries.sessions.access(token);
	if (!session) return redirect("/?error=Your session has expired, please login again");

	const user = queries.users.getById(session.user_id);
	if (!user) return redirect("/?error=Your session has expired, please login again");

	return user;
}
