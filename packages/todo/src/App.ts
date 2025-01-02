import "./styles.css";

import { div, h2, p, button, form, input, label, svg, li, header, ul } from "@hyperactive/hyper/elements";
import { trust, Member, List, State, renderDOM } from "@hyperactive/hyper";
import type { Window } from "@hyperactive/hyper/dom";

declare const window: Window;

const S = (path: string) => {
	return svg(
		// @ts-expect-error SVG attributes are not typed correctly?
		{ width: "32", height: "32", fill: "#000000", viewBox: "0 0 256 256" },
		trust(path),
	);
};

export const Hero = (completed: State<number>, total: State<number>) => {
	return header(
		div(h2("Tasks done"), p("頑張って〜！")),
		div(
			{ class: "progress" },
			p(
				completed.to(v => String(v)),
				" / ",
				total.to(v => String(v)),
			),
		),
	);
};

export function Form(todos: List<Item>) {
	const handleSubmit = (event: any) => {
		event.preventDefault();
		const title = event.target.todo.value;
		if (!title) return;
		todos.append({ title, id: window.crypto.randomUUID(), completed: false });
		event.target.reset();
	};

	return form(
		{ on: { submit: handleSubmit } },
		label(
			input({
				type: "text",
				name: "todo",
				id: "todo",
				placeholder: "Write your next task",
				autofocus: true,
			}),
		),
		button(
			{ title: "Add task" },
			S(
				`<path d="M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z"></path>`,
			),
		),
	);
}

export interface Item {
	id: string;
	title: string;
	completed: boolean;
}

export function LocalEditableInput(item: Member<Item>) {
	const value = new State(item.value.title);

	return input({
		type: "text",
		value,
		on: {
			blur: () => item.setWith(i => ({ ...i, title: value.value })),
			change: e => value.set((e.target as any).value),
		},
	});
}

export function Item(item: Member<Item>) {
	return item.to(i =>
		li(
			{ class: i.completed ? "completed" : "" },
			button(
				{
					title: i.completed ? "Mark as not completed" : "Mark as completed",
					on: { click: () => item.set({ ...i, completed: !i.completed }) },
				},
				svg(
					// @ts-expect-error SVG attributes are not typed correctly?
					{ width: "32", height: "32", fill: "#000000", viewBox: "0 0 256 256" },
					trust('<circle cx="128" cy="128" r="108"></circle>'),
				),
			),
			button({ class: "task-name" }, LocalEditableInput(item)),
			button(
				{ title: "Delete", on: { click: () => item.remove() } },
				S(
					'<path d="M216,48H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM192,208H64V64H192ZM80,24a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,24Z"></path>',
				),
			),
		),
	);
}

export function Home() {
	const todos = new List<Item>();

	window.addEventListener("load", () => {
		const fromMem = JSON.parse(window.localStorage.getItem("todos") || "[]") as Item[];
		if (!fromMem.length) {
			fromMem.push({
				title: "Get started!",
				id: window.crypto.randomUUID(),
				completed: false,
			});
		}
		fromMem.forEach(todo => todos.append(todo));
	});

	todos.listen(() => {
		window.localStorage.setItem("todos", JSON.stringify(todos.toArray()));
	});

	const completed = todos.filter(todo => todo.completed).size;
	const total = todos.size;

	return div.container(
		//
		Hero(completed, total),
		Form(todos),
		ul(todos.each(todo => Item(todo))),
	);
}

renderDOM(window.document.getElementById("app")!, Home());
