# hyperactive

Hyperactive is a suite of tools to build smart webapps. As of 1.0, only server-side render is supported.

You're on the experimental branch where interesting things are happening!

## Usage example

```TypeScript
import { elements, renderHTML } from "https://deno.land/x/hyperactive/mod.ts";

const { div, p, h1 } = elements;

assertEquals(
  renderHTML(
    div(
      { id: "hello", class: "world" },
      p(h1({ class: "hello" }, "hello world", br())),
    ),
  ),
  `<div id="hello" class="world"><p><h1 class="hello">hello world<br /></h1></p></div>`,
);
```
