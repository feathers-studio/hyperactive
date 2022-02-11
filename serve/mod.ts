import { type HyperNode, renderHTML } from "../hyper/mod.ts";

export type Middleware<In, Out> = (ctx: Context<In, Out>) => Promise<void>;

export type Context<In, Out> = {
	state: In;
	request: Request;
	responded: boolean;
	respond: (body?: BodyInit | null, init?: ResponseInit) => Promise<void>;
	html: (body: HyperNode, init?: ResponseInit) => Promise<void>;
	next: (state: Out) => Promise<void>;
};

export function o<In, Out, T>(f: Middleware<T, Out>, g: Middleware<In, T>): Middleware<In, Out> {
	return (ctx: Context<In, Out>) =>
		g(Object.assign(Object.create(ctx), {
			next(state: T) {
				return f(Object.assign(Object.create(ctx), {
					state,
					next: ctx.next,
				}));
			},
		}));
}

export function router(...fs: Middleware<unknown, unknown>[]) {
	return fs.reduceRight(o);
}

const h404: Middleware<unknown, unknown> = (ctx) => {
	return ctx.respond(`Cannot ${ctx.request.method} ${new URL(ctx.request.url).pathname}`, { status: 404 });
};

function makeContext(e: Deno.RequestEvent): Context<unknown, unknown> {
	const self: Context<unknown, unknown> = {
		request: e.request,
		state: undefined,
		responded: false,
		respond(body, init) {
			if (self.responded) throw new Error("Can't call respond() twice");
			self.responded = true;
			return e.respondWith(new Response(body, init));
		},
		html(body, init) {
			const headers = new Headers(init?.headers);
			headers.set("Content-Type", "text/html; charset=UTF-8");
			return self.respond("<!DOCTYPE html>" + renderHTML(body), {
				headers,
				status: init?.status,
				statusText: init?.statusText,
			});
		},
		next(state) {
			if (self.responded) throw new Error("Can't call next() after calling respond()");
			return h404({
				...self,
				state,
			});
		},
	};
	return self;
}

export function serve(opts: Deno.ListenOptions, handler: Middleware<unknown, unknown>) {
	async function handleHttp(conn: Deno.Conn) {
		for await (const e of Deno.serveHttp(conn)) {
			handler(makeContext(e));
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

export function filter<T>(predicate: (ctx: Context<T, T>) => boolean, middleware: Middleware<T, T>): Middleware<T, T> {
	return (ctx) => predicate(ctx) ? middleware(ctx) : ctx.next(ctx.state);
}

export function method(
	m:
		| "GET"
		| "HEAD"
		| "POST"
		| "PUT"
		| "DELETE"
		| "CONNECT"
		| "OPTIONS"
		| "TRACE"
		| "PATCH",
) {
	return <T>(pattern: string, middleware: Middleware<T, T>): Middleware<T, T> => {
		const urlPattern = new URLPattern({ pathname: pattern });
		const pred = (ctx: Context<T, T>) => ctx.request.method === m && urlPattern.test(ctx.request.url);
		return filter<T>(pred, middleware);
	};
}

export const options = method("OPTIONS");
export const get = method("GET");
export const post = method("POST");
export const put = method("PUT");
export const patch = method("PATCH");
export const del = method("DELETE");
