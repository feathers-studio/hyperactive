## Installation

If you use npm:

```bash
npm install https://gethyper.dev
```

Or, if you use pnpm, yarn, or bun:

```bash
pnpm add https://gethyper.dev
```

## Basic Usage

### On the Server

`renderHTML` is used to render a Hyperactive component to a HTML string. Use this like a template engine.

```TypeScript
import { renderHTML } from "@hyperactive/hyper";
import { html, head, body, section, img, h1, title, link } from "@hyperactive/hyper/elements";

const GreeterPage = (name: string) =>
	renderHTML(
		html(
			head(
				title("Greeter"),
				link({ rel: "stylesheet", href: "/assets/style.css" }),
			),
			body(
				section(
					{ class: "container" },
					img({ src: "/hero.jpg" }),
					h1("Hello ", name),
				),
			),
		),
	);

Bun.serve({
	port: 3000,
	fetch(req) {
		if (req.url === "/") {
			return new Response(
				GreeterPage("World"),
				{ headers: { "Content-Type": "text/html" } },
			);
		}
	},
});
```

### In the Browser

`renderDOM` is used to render a Hyperactive component to the DOM.

This is a truly reactive system, where the DOM is updated whenever relevant state changes. Unlike frameworks like React, Hyperactive doesn't use a virtual DOM. Instead, it remembers what state changes affect which DOM nodes, and only updates the DOM nodes that need to be updated. Unlike Svelte, Hyperactive doesn't use a compiler. Instead, it uses a runtime library that is designed to be as small and fast as possible. This is the ideal: a Hyperscript that is more convenient as React, fast as Svelte, and as reactive as Solid.

[![@types/web 0.0.188](https://img.shields.io/static/v1?label=@types/web&message=0.0.188&style=for-the-badge&labelColor=ff0000&color=fff)](https://npmjs.com/package/@types/web)

Please install `@types/web` to use Hyperactive in the browser. Your package manager will automatically install the correct version of `@types/web` for you by default. See the [versions](./docs/versions.md) table for the correct version of `@types/web` for each version of Hyperactive.

```bash
bun add @types/web
```

```TypeScript
import { State, renderDOM } from "@hyperactive/hyper";
import { div, p, button } from "@hyperactive/hyper/elements";

const count = new State(0);

const root = document.getElementById("root");

renderDOM(
	root,
	div(
		p("You clicked ", count, " times"),
		button(
			{ on: { click: () => count.set(count.value + 1) } },
			"Increment"
		),
	),
);

```

Notice how there are no components, nor is state boxed inside of them. Instead, state is just a plain variable that can be used anywhere. Components can still be used for convenience and to encapsulate state, but they disappear while Hyperactive renders them. Hyperactive only remembers the DOM node to update. In this example, the `div` element is updated when the `count` state changes. The rest of the tree is never updated, so Hyperactive doesn't manage them.

Let's refactor this example to use a component.

```TypeScript
const Counter = () => {
	const count = new State(0);

	return div(
		p("You clicked ", count, " times"),
		button(
			{ on: { click: () => count.set(count.value + 1) } },
			"Increment"
		),
	);
};

renderDOM(root, Counter());
```

<details>
<summary>But where is my JSX?!</summary>

Hyperactive doesn't use JSX. Instead, we use a simple, declarative JavaScript syntax that is easy to understand and write. In the future, we may consider adding JSX support, and we welcome any contributions in this direction. Ideally we may only need to adapt our `h` function and add `Fragment` support.

</details>
