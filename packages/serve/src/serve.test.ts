import { readableStreamFromReader } from "https://deno.land/std@0.125.0/streams/conversion.ts";
import { type Context, eventsource, get, type Middleware, router, serve, ws } from "./mod.ts";
import { PassThrough } from "./passthrough.ts";

type User = { name: string };
const State = new WeakMap<Context, { user: User }>();

const sleep = (t: number) => new Promise(r => setTimeout(r, t));

type Cookies = { cookies: string[] };
const cookies: Middleware<Cookies> = (ctx, next) => next();

const server = serve(
	{ port: 4000 },
	router(
		cookies,
		router(
			get("/", ctx => {
				const url = new URL(ctx.request.url);
				new URL("", url);
				return ctx.respond(
					JSON.stringify({
						hash: url.hash,
						host: url.host,
						hostname: url.hostname,
						href: url.href,
						origin: url.origin,
						password: url.password,
						pathname: url.pathname,
						port: url.port,
						protocol: url.protocol,
						search: url.search,
						searchParams: [...url.searchParams.entries()],
					}),
				);
			}),
			// get("/", (ctx, next) => {
			// 	const passthrough = new PassThrough();
			// 	let cancel = false;
			// 	setInterval(() => {
			// 		if (cancel) return;
			// 		passthrough.write(new TextEncoder().encode("Hello\r\n"));
			// 	}, 1000);
			// 	return ctx.respond(readableStreamFromReader(passthrough), { headers: { "Transfer-Encoding": "chunked" } })
			// 		.catch(() => {
			// 			cancel = true;
			// 			console.log("Caught");
			// 		});
			// }),
			// get("/favicon.ico", (ctx) => ctx.respond(new ArrayBuffer(0))),
			// ws("/socket", async (socket) => {
			// 	socket.addEventListener("message", (e) => console.log(e.data));
			// 	// socket.addEventListener("");
			// }),
			// get("/", (ctx) => {
			// 	return ctx.respond(ctx.state.user?.name);
			// }),
			// eventsource("/notifs", async (ctx) => {
			// 	try {
			// 		const resp = ctx.startResponse();

			// 		console.log("connected");
			// 		await ctx.comment("comment");
			// 		await sleep(1000);
			// 		await ctx.event({ data: "helloxxx", event: "hello" });

			// 		await resp;
			// 	} catch (e) {
			// 		console.log(e);
			// 	}
			// }),
		),
	),
);

server.start();
console.log("Listening on port", 4000);
