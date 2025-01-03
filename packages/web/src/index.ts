import { serve } from "bun";
import { join, extname } from "node:path";
import { lookup } from "mime-types";
import { generateETagFromFile, html, redirect, seconds } from "@hyperactive/serve/utils";
import { Home } from "./pages/home";
import { Layout } from "./pages/layout";

const port = process.env.PORT || 3000;
const S3_ASSETS_ROOT = "https://gethyper.s3.fr-par.scw.cloud/assets";
const ASSETS_ROOT = join(import.meta.dir, "../public/assets");

// User agent strings
// 'user-agent': 'npm/10.1.0 node/v20.8.1 linux x64 workspaces/false'
// 'user-agent': 'pnpm/8.10.5 npm/? node/v20.8.1 linux x64'
// 'user-agent': 'yarn/1.22.21 npm/? node/v20.8.1 linux x64'
// 'user-agent': 'Bun/1.0.14'

const layout = Layout("Hyperactive - a powerful toolbox for modern web application development");

serve({
	port,
	async fetch(req) {
		const url = new URL(req.url);
		const method = req.method;
		const pathname = url.pathname;
		const ua = req.headers.get("user-agent");
		const isNPMLike = ua?.includes("npm") || ua?.includes("Bun");

		if (isNPMLike) {
			if (pathname === "/")
				return new Response(null, {
					status: 301,
					headers: { location: "https://gethyper.s3.fr-par.scw.cloud/pkg/hyperactive-hyper-2.0.0-beta.1.tgz" },
				});
		}

		if (method === "GET") {
			// if (pathname.startsWith("/fonts/")) return redirect(S3_ASSETS_ROOT + pathname);

			if (url.pathname.startsWith("/assets/")) {
				const assetPath = join(ASSETS_ROOT, url.pathname.slice("/assets/".length));
				if (!assetPath.startsWith(ASSETS_ROOT)) {
					return new Response("Access Denied", { status: 403 });
				}
				return new Response(Bun.file(assetPath), {
					headers: {
						"Content-Type": lookup(extname(assetPath)) || "application/octet-stream",
						// "Cache-Control": `public, max-age=${seconds(10)}`,
						// "ETag": await generateETagFromFile(assetPath),
					},
				});
			}

			if (pathname === "/") return html(layout(await Home()));
		}

		return new Response("Not found", { status: 404 });
	},
});

console.log(`Server is running on port ${port}`);
