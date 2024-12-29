import { trust, ListMember, ListState } from "@hyperactive/hyper";
import { button, div, ol, li, p, span, svg } from "@hyperactive/hyper/elements";

export interface Item {
	id: string;
	title: string;
	completed: boolean;
}

export function Item(item: ListMember<Item>) {
	return li(
		{ class: "todo_item" },
		button(
			{ class: "todo_items_left" },
			svg(trust('<circle cx="11.998" cy="11.998" fillRule="nonzero" r="9.998" />')),
			p(item.transform(i => i.title)),
		),
		div(
			{ class: "todo_items_right" },
			button(span({ class: "visually-hidden" }, "Edit"), svg(trust('<path d="" />'))),
			button(span({ class: "visually-hidden" }, "Delete"), svg(trust('<path d="" />'))),
		),
	);
}

export function List(todos: ListState<Item>) {
	return ol(
		{ class: "todo_list" },
		todos.each(todo => Item(todo)),
	);
}
