# hyperserve

Part of the [hyperactive](https://github.com/feathers-studio/hyperactive) project. A lean server library that's functional by design and integrates seamlessly with hyperactive itself.

## Getting started

```TypeScript
import { http, router, get } from "https://deno.land/x/hyperactive/serve.ts";

const server = http({ port: 3000 }, router(
	get("/", ctx => ctx.respond("Hello world")),
	...
));

server.start();
console.log("Listening on port", 3000);
```
