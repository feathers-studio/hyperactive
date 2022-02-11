import { type Context, filter, type Middleware } from "./core.ts";

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
