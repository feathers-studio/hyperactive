import { type Context, filter, type Middleware, router } from "./core.ts";

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
