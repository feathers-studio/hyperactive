import { config } from "./config";

import { join } from "node:path";
import { authenticate } from "./middleware/auth";
import { login, logout, loginPage } from "./pages/auth";
import { dashboard } from "./pages/dashboard";
import * as links from "./pages/links";

const ASSETS_ROOT = join(__dirname, "../assets/");

Bun.serve({
	port: config.port,
	async fetch(request, server) {
		const method = request.method;
		const url = new URL(request.url);
		const ip = request.headers.get("x-forwarded-for") ?? server.requestIP(request)?.address ?? null;

		console.log(`${method} ${url.pathname}${url.search} [${ip}]`);

		if (method === "GET") {
			if (url.pathname.startsWith("/assets/")) {
				const assetPath = join(ASSETS_ROOT, url.pathname.slice("/assets/".length));
				if (!assetPath.startsWith(ASSETS_ROOT)) {
					return new Response("Access Denied", { status: 403 });
				}
				return new Response(Bun.file(assetPath));
			}
		}

		if (method === "POST") {
			if (url.pathname === "/login") return login(request, { ip });
			if (url.pathname === "/logout") return logout(request);
		}

		const user = await authenticate(request);
		if (user instanceof Response) {
			if (url.pathname === "/") return loginPage(request, { url });
			return user;
		}

		if (url.pathname === "/") {
			return dashboard(request, { user, url });
		}

		if (url.pathname === "/links") {
			if (method === "POST") return links.POST(request, { user });
		}

		return links.GET(request, { url, ip });
	},
});

console.log("Blink is running on http://localhost:3000");
