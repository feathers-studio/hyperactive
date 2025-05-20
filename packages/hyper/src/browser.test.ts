import { renderDOM, State } from "./index.ts";
import { div, input, p, ul, button, li, form } from "./elements.ts";

import type { Document } from "./lib/dom.ts";
import { List, Member } from "./list.ts";
declare const document: Document;
const root = document.getElementById("root")!;

// {
// 	const state = new State("");

// 	renderDOM(
// 		root,
// 		div(
// 			{ class: "container" },
// 			input({
// 				type: "text",
// 				// value: state.value,
// 				on: {
// 					input(e) {
// 						const value = (e.target as any).value;
// 						state.set(value);
// 					},
// 				},
// 			}),
// 			p(state.to(s => (s === "Bye" ? h1("Good", b("bye!")) : span("Hello ", s, " !")))),
// 		),
// 	);
// }

{
	// Hyperactive version

	const Todo = (todo: Member<{ id: number; content: string }>) => {
		const state = new State(todo.value.content);

		return li(
			// span(todo.index.to(i => String(i + 1))),
			form(
				p(todo.to(t => t.content || "Untitled")),
				input({
					type: "text",
					value: state,
					on: { input: e => state.set((e.target as any).value) },
				}),
				button(
					{
						on: {
							async click() {
								// await fetch("...", {
								// 	method: "PUT",
								// 	body: JSON.stringify({ value: state.value }),
								// });
								todo.set({ ...todo.value, content: state.value });
							},
						},
					},
					"Update",
				),
				button(
					{
						on: {
							async click() {
								// await fetch("...", {
								// 	method: "DELETE",
								// 	body: JSON.stringify({ value: state.value }),
								// });
								todo.remove();
							},
						},
					},
					"Delete",
				),
			),
		);
	};

	const App = () => {
		const todos = new List([
			{ id: 1, content: "Hyperactive" },
			{ id: 2, content: "Jigza" },
			{ id: 3, content: "Telegraf" },
		]);

		// const interval = setInterval(() => {
		// 	todos.append({ id: todos.size.value + 1, content: "Untitled" });
		// }, 1000);

		return div.container(
			// button({ on: { click: () => clearInterval(interval) } }, "STOP"),
			ul(todos.each(Todo)),
			button(
				{ on: { click: () => todos.append({ id: todos.size.value + 1, content: "" }) } },
				"Add",
			),
		);
	};

	renderDOM(root, App());
}
