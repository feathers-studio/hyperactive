// // @ts-nocheck

// import { h, renderDOM, State } from "./index.ts";
// import { div, input, h3, p, span, h1, ul, b } from "./elements.ts";

// import type { Document } from "./lib/dom.ts";
// import { List } from "./list.ts";
// declare const document: Document;

// const state = new State("1");

// const root = document.getElementById("root")!;

// renderDOM(
// 	root,
// 	div(
// 		{ class: "container" },
// 		h3("Enter a number, it should double below"),
// 		input({ type: "number", on: { change: e => state.set((e.target as any).value) } }),
// 		p(span(state.transform(v => String(parseFloat(v) * 2)))),
// 	),
// );

// {
// 	// Hyperactive version

// 	const Todo = (todo: State<{ id: number; content: string }>) => {
// 		const state = new State(todo.value.content);

// 		return li(
// 			span(todo.index.transform(i => String(i + 1))),
// 			form(
// 				p(todo.transform(t => t.content)),
// 				input({
// 					type: "text",
// 					value: state,
// 					on: { input: e => state.update(e.target.value) },
// 				}),
// 				button({
// 					on: {
// 						async click() {
// 							await fetch("...", {
// 								method: "PUT",
// 								body: JSON.stringify({ value: state.value }),
// 							});
// 							todo.update({ ...todo, content: state.value });
// 						},
// 					},
// 				}),
// 			),
// 		);
// 	};

// 	const App = () => {
// 		const todos = new List([
// 			{ id: 1, content: "Hyperactive" },
// 			{ id: 2, content: "Jigza" },
// 			{ id: 3, content: "Telegraf" },
// 		]);

// 		div(
// 			{ class: "container" },
// 			ol(todos.transform(Todo)),
// 			button({ on: { click: () => todos.push({ id: todos.length + 1, content: "" }) } }, "Add"),
// 		);
// 	};

// 	renderDOM(root, App());
// }

// // {
// // 	const numbers = new List([1, 2, 3]);

// // 	renderDOM(
// // 		root,
// // 		div(
// // 			{ class: "container" },
// // 			ul(
// // 				numbers.transform(num => {
// // 					return li(
// // 						input({
// // 							type: "number",
// // 							value: num,
// // 							on: {
// // 								input(e) {
// // 									const value = parseFloat((e.target as any).value);
// // 									num.update(value);
// // 								},
// // 							},
// // 						}),
// // 					);
// // 				}),
// // 			),
// // 			ul(
// // 				numbers.transform(num => {
// // 					return li(p(num.transform(n => n * 2)));
// // 				}),
// // 			),
// // 		),
// // 	);
// // }

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
// 						state.update(value);
// 					},
// 				},
// 			}),
// 			p(state.transform(s => (s === "Bye" ? h1("Good", b("bye!")) : span("Hello ", s, " !")))),
// 		),
// 	);
// }
