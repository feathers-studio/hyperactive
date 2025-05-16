<div align="center">
  <img src="./docs/Hyper.svg" alt="Hyperactive">
</div>

<div align="center">
<h1>hyperactive</h1>
</div>

Hyperactive is a powerful set of tools to build reactive web applications.

We're currently working on a 2.0 release, which will include fully reactive client-side rendering. To try the latest version, you can get `hyper`:

```bash
npm install https://gethyper.dev

yarn add https://gethyper.dev

pnpm add https://gethyper.dev

bun install https://gethyper.dev
```

Hyperactive is also available on [NPM](https://www.npmjs.com/package/@hyperactive/hyper).

This is not a release version, so expect some bugs.

[![Hyperactive Version 2.0.0-beta.8](https://img.shields.io/static/v1?label=Version&message=2.0.0-beta.8&style=for-the-badge&labelColor=FF6A00&color=fff)](https://npmjs.com/package/@hyperactive/hyper)

<div align="center">
<h2>Usage</h2>
</div>

### On the server

```TypeScript
import { renderHTML } from "@hyperactive/hyper";
import { div, p, h1, br } from "@hyperactive/hyper/elements";

assertEquals(
  renderHTML(
    section(
      { class: "container" },
      div(
        img({ src: "/hero.jpg" }),
        h1("Hello World"),
      ),
    ),
  ),
  `<div class="container"><div><img src="/hero.jpg" /><h1>Hello World</h1></div></div>`,
);
```

### In the browser

[![@types/web 0.0.234](https://img.shields.io/static/v1?label=@types/web&message=0.0.234&style=for-the-badge&labelColor=ff0000&color=fff)](https://npmjs.com/package/@types/web)

Please install `@types/web` to use Hyperactive in the browser. Your package manager will automatically install the correct version of `@types/web` for you by default. See the [versions](./docs/versions.md) table for the correct version of `@types/web` for each version of Hyperactive.

```bash
bun install @types/web
```

```TypeScript
import { State, renderDOM } from "@hyperactive/hyper";
import { div, p, button } from "@hyperactive/hyper/elements";

const s = new State(0);

const root = document.getElementById("root");

renderDOM(
  root,
  div(
    p("You clicked ", s, " times"),
    button(
      { on: { click: () => s.update(s.value + 1) } },
      "Increment"
    ),
  ),
);

```

<div align="center">
<h2>Testimonials</h2>
</div>

<div align="center">
  <img src="./docs/thomas.jpg" alt="Thomas's testimonial" width="400">
</div>
