import { type HyperNode, renderHTML } from "../hyper/mod.ts";

export type Next = () => Promise<void>;

export type Middleware<State = {}> = (ctx: Context<State>, next: Next) => Promise<void>;

export type Context<State = {}> = {
	request: Request;
	responded: boolean;
	respond: (body?: Response | BodyInit | null, init?: ResponseInit) => Promise<void>;
	html: (body: string, init?: ResponseInit) => Promise<void>;
	render: (body: HyperNode, init?: ResponseInit) => Promise<void>;
	state: Partial<State>;
};

export function o<State = {}>(f: Middleware<State>, g: Middleware<State>): Middleware<State> {
	return (ctx: Context<State>, next: Next) => g(ctx, () => f(ctx, next));
}

export function router<State = {}>(...fs: Middleware<State>[]): Middleware<State> {
	if (fs.length === 0) throw new TypeError("router requires at least one Middleware");
	return fs.reduceRight(o);
}

const h404: Middleware = ctx => {
	return ctx.respond(`Cannot ${ctx.request.method} ${new URL(ctx.request.url).pathname}`, { status: 404 });
};

function Context(e: Deno.RequestEvent): Context {
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
			return self.respond(body, {
				headers,
				status: init?.status,
				statusText: init?.statusText,
			});
		},
		render(body, init) {
			return self.html("<!DOCTYPE html>" + renderHTML(body), init);
		},
		state: {},
	};

	return self;
}

export const noop = async (): Promise<void> => void 0;

export function serve<State>(opts: Deno.ListenOptions, handler: Middleware<State>) {
	async function handleHttp(conn: Deno.Conn) {
		for await (const e of Deno.serveHttp(conn)) {
			const ctx = Context(e);
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
	return (ctx, next) => (predicate(ctx) ? middleware(ctx, next) : next());
}
