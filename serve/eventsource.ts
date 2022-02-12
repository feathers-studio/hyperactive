import { readableStreamFromReader, writeAll } from "https://deno.land/std@0.125.0/streams/conversion.ts";

import { type Context, filter, type Middleware } from "./core.ts";
import { PassThrough } from "./passthrough.ts";

export type Event = {
	event?: string;
	data: string;
	id?: string;
	retry?: number;
};

export type EventSourceContext<State = {}> = {
	request: Request;
	comment: (content: string) => Promise<void>;
	event: (e: Event) => Promise<void>;
	ended: boolean;
	startResponse: (headers?: HeadersInit) => Promise<void>;
	state: Partial<State>;
};

type EventSourceHandler<State = {}> = (ctx: EventSourceContext<State>) => Promise<void>;

/**
 * Converts `{ data: "Hello\nWorld", id: "1" }` to
 *
 * ```
 * data: Hello
 * data: World
 * id: 1
 * ```
 */
function eventToString(o: Record<string, string | number>) {
	return Object.entries(o).map(([k, v]) => String(v).split("\n").map((line) => `${k}: ${line}`).join("\n")).join("\n");
}

async function write(buf: PassThrough, content: string) {
	if (!content) return;
	return void await writeAll(buf, new TextEncoder().encode(content + "\n\n"));
}

function EventSourceContext<State = {}>(ctx: Context<State>): EventSourceContext<State> {
	const passthrough = new PassThrough();
	const stream = readableStreamFromReader(passthrough);

	const self: EventSourceContext<State> = {
		request: ctx.request,
		comment: (content) => write(passthrough, ": " + content),
		event: (event) => write(passthrough, eventToString(event)),
		ended: false,
		startResponse: (headersInit) => {
			const headers = new Headers(headersInit);
			headers.set("Cache-Control", "no-store");
			headers.set("Content-Type", "text/event-stream");
			return ctx.respond(stream, { headers }).then(() => {
				self.ended = true;
			}).catch((e) => {
				self.ended = true;
				return Promise.reject(e);
			});
		},
		state: ctx.state,
	};

	return self as EventSourceContext<State>;
}

export function eventsource<State = {}>(pattern: string, handler: EventSourceHandler<State>): Middleware<State> {
	const urlPattern = new URLPattern({ pathname: pattern });
	const pred = (ctx: Context<State>) => urlPattern.test(ctx.request.url);
	return filter(pred, async (ctx) => {
		return handler(EventSourceContext<State>(ctx));
	});
}
