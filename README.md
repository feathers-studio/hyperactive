# hyperactive

Hyperactive is a suite of tools to build smart webapps. As of 1.0, only server-side render is supported. Client-side render with `renderDOM` works, but more work is ongoing on the reactive part.

## Usage example

```TypeScript
// if using Deno
import { elements, renderHTML } from "https://deno.land/x/hyperactive/mod.ts";

// if using Node
import { elements, renderHTML } from "@hyperactive/hyper";

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

## User testimonials

![@TRWII](./hpr-trgwii.jpg)
