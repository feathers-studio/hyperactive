import "./styles.css";

import { div, h2, p, section, button, form, input, label, span, svg, ol, li } from "@hyperactive/hyper/elements";
import { trust, ListMember, ListState, State, renderDOM, h } from "@hyperactive/hyper";
import type { Document } from "@hyperactive/hyper/dom";

declare const document: Document;

export const Hero = (completed: State<number>, total: State<number>) => {
	return section(
		{ class: "hero" },
		div(h2("Tasks done"), p("Keep it up")),
		div(
			p(
				completed.transform(v => String(v)),
				"/",
				total.transform(v => String(v)),
			),
		),
	);
};

export function Form() {
	const handleSubmit = (event: any) => {
		event.preventDefault();
		// reset the form
		event.target.reset();
	};

	return form(
		{
			class: "form",
			on: { submit: handleSubmit },
		},
		label(
			input({
				type: "text",
				name: "todo",
				id: "todo",
				placeholder: "Write your next task",
			}),
		),
		button(
			span({ class: "visually-hidden" }, "Submit"),
			svg(
				// @ts-expect-error SVG attributes are not typed correctly?
				{ width: "32", height: "32", fill: "#000000", viewBox: "0 0 256 256" },
				trust(
					`<path d="M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z"></path>`,
				),
			),
		),
	);
}

export interface Item {
	id: string;
	title: string;
	completed: boolean;
}

export function Item(item: ListMember<Item>) {
	return li(
		button(
			svg(trust('<circle cx="11.998" cy="11.998" fillRule="nonzero" r="9.998" />')),
			p(item.transform(i => i.title)),
		),
		div(
			button(span({ class: "visually-hidden" }, "Edit"), svg(trust('<path d="" />'))),
			button(span({ class: "visually-hidden" }, "Delete"), svg(trust('<path d="" />'))),
		),
	);
}

export function Home() {
	const todos = new ListState<Item>([
		{
			title: "Some task",
			id: window.crypto.randomUUID(),
			completed: false,
		},
		{
			title: "Some other task",
			id: window.crypto.randomUUID(),
			completed: true,
		},
		{
			title: "last task",
			id: window.crypto.randomUUID(),
			completed: false,
		},
	]);

	const completed = todos.filter(todo => todo.completed).size();
	const total = todos.size();

	return div.container(
		//
		Hero(completed, total),
		Form(),
		ol(todos.each(todo => Item(todo))),
	);
}

renderDOM(document.getElementById("app")!, Home());
