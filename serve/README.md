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
