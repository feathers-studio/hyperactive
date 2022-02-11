import { type HyperNode, renderHTML } from "../hyper/mod.ts";

export type Next = () => Promise<void>;

export type Middleware<State = {}> = (ctx: Context<State>, next: Next) => Promise<void>;

export type Context<State = {}> = {
	request: Request;
	responded: boolean;
	respond: (body?: Response | BodyInit | null, init?: ResponseInit) => Promise<void>;
	html: (body: HyperNode, init?: ResponseInit) => Promise<void>;
	state: State;
};

export function o<State = {}>(
	f: Middleware<State>,
	g: Middleware<State>,
): Middleware<State> {
	return (ctx: Context<State>, next: Next) => g(ctx, () => f(ctx, next));
}

export function router<State = {}>(...fs: Middleware<State>[]) {
	return fs.reduceRight(o);
}

const h404: Middleware = (ctx) => {
	return ctx.respond(`Cannot ${ctx.request.method} ${new URL(ctx.request.url).pathname}`, { status: 404 });
};

function makeContext(e: Deno.RequestEvent): Context {
	let responded = false;

	const self: Context = {
		request: e.request,
		get responded() {
			return responded;
		},
		respond(body, init) {
			if (responded) throw new Error("Can't call respond() twice");
			responded = true;
			return e.respondWith(body instanceof Response ? body : new Response(body, init));
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
		state: {},
	};
	return self;
}

export const noop = async (): Promise<void> => void 0;

export function serve(opts: Deno.ListenOptions, handler: Middleware) {
	async function handleHttp(conn: Deno.Conn) {
		for await (const e of Deno.serveHttp(conn)) {
			const ctx = makeContext(e);
			handler(ctx, () => h404(ctx, noop));
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

export function filter<State = {}>(
	predicate: (ctx: Context<State>) => boolean,
	middleware: Middleware<State>,
): Middleware<State> {
	return (ctx, next) => predicate(ctx) ? middleware(ctx, next) : next();
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
	return <State = {}>(pattern: string, ...middleware: Middleware<State>[]): Middleware<State> => {
		const urlPattern = new URLPattern({ pathname: pattern });
		const pred = (ctx: Context<State>) => ctx.request.method === m && urlPattern.test(ctx.request.url);
		return filter(pred, router(...middleware));
	};
}

export const options = method("OPTIONS");
export const get = method("GET");
export const post = method("POST");
export const put = method("PUT");
export const patch = method("PATCH");
export const del = method("DELETE");

export type WebSocketHandler = (socket: WebSocket) => Promise<void>;

export function ws<State = {}>(pattern: string, handler: WebSocketHandler): Middleware<State> {
	const urlPattern = new URLPattern({ pathname: pattern });
	const pred = (ctx: Context<State>) => urlPattern.test(ctx.request.url);
	return filter(pred, async (ctx) => {
		const { response, socket } = Deno.upgradeWebSocket(ctx.request);
		await ctx.respond(response);
		return handler(socket);
	});
}
