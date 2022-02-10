import { type HyperNode, renderHTML } from "../hyper/mod.ts";

export type Middleware = (ctx: Context) => Promise<void>;

export type Context = {
	request: Request;
	responded: boolean;
	respond: (body?: BodyInit | null, init?: ResponseInit) => Promise<void>;
	html: (body: HyperNode, init?: ResponseInit) => Promise<void>;
	next: Middleware;
};

function o(f: Middleware, g: Middleware) {
	return function (ctx: Context) {
		return g({
			...ctx,
			next(ctx) {
				if (ctx.responded) throw new Error("Can't call next() after calling respond()");
				return f(ctx);
			},
		});
	};
}

export function router(...fs: Middleware[]) {
	return fs.reduceRight(o, function InitNext(ctx) {
		return ctx.next(ctx);
	});
}

const h404: Middleware = ctx => {
	return ctx.respond(`Cannot ${ctx.request.method} ${new URL(ctx.request.url).pathname}`, { status: 404 });
};

export function http(opts: Deno.ListenOptions, handler: Middleware) {
	async function handleHttp(conn: Deno.Conn) {
		for await (const e of Deno.serveHttp(conn)) {
			const ctx: Context = {
				request: e.request,
				responded: false,
				respond(body, init) {
					ctx.responded = true;
					return e.respondWith(new Response(body, init));
				},
				html(body, init) {
					const headers = new Headers(init?.headers);
					headers.set("Content-Type", "text/html; charset=UTF-8");
					return ctx.respond("<!DOCTYPE html>" + renderHTML(body), {
						headers,
						status: init?.status,
						statusText: init?.statusText,
					});
				},
				next(ctx) {
					return h404(ctx);
				},
			};

			router(handler, h404)(ctx);
		}
	}

	const server = Deno.listen(opts);

	async function start() {
		for await (const conn of server) handleHttp(conn);
	}

	return {
		start,
		close() {
			server.close();
		},
	};
}

export function method(m: string) {
	return (pattern: string, ...middleware: Middleware[]): Middleware => {
		const urlPattern = new URLPattern({ pathname: pattern });
		const ms: Middleware = router(...middleware);
		return function (ctx) {
			if (ctx.request.method === m && urlPattern.test(ctx.request.url)) return ms(ctx);
			return ctx.next(ctx);
		};
	};
}

export const options = method("OPTIONS");
export const get = method("GET");
export const post = method("POST");
export const put = method("PUT");
export const patch = method("PATCH");
export const del = method("DELETE");
