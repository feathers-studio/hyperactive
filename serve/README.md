# hyperserve

Part of the [hyperactive](https://github.com/feathers-studio/hyperactive) project. A lean server library that's functional by design and integrates seamlessly with hyperactive itself.

## Getting started

```TypeScript
import { get, router, serve } from "https://deno.land/x/hyperactive/serve.ts";

const server = serve(
	{ port: 3000 },
	router(
		get("/", (ctx, next) => next(), (ctx) => ctx.respond("Hello world")),
		get("/foo", (ctx) => ctx.respond("Foo")),
		get("/bar", (ctx) => ctx.respond("Bar")),
	),
);

console.log("Listening on port", 3000);
server.start();
```

## Using websockets

`hyperserve` supports websockets straight in your application! It's as simple as calling the `ws` util.

```TypeScript
serve(
	{ port: 3000 },
	router(
		get("/", (ctx, next) => next(), (ctx) => ctx.respond("Hello world")),
		ws("/foo", async (socket) => {
			socket.addEventListener("message", (e) => console.log(e.data));
		}),
	),
);
```

## Using server-sent events

[Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) is an alternative to websockets when you only need to publish data one-way from the server.

```TypeScript
serve(
	{ port: 3000 },
	router(
		get("/", (ctx, next) => next(), (ctx) => ctx.respond("Hello world")),
		eventsource("/notifs", async (ctx) => {
			setInterval(() => {
				// Sends a notification every second
				ctx.event({ event: "notification", data: "You have a message" });
			}, 1000);
		}),
	),
);
```
