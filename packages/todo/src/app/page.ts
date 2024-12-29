import "./styles.css";

import { div } from "@hyperactive/hyper/elements";
import { ListState } from "@hyperactive/hyper";
import { Header } from "../components/Header.ts";
import { Hero } from "../components/Hero.ts";
import { Item, List } from "../components/List.ts";
import { Form } from "../components/Form.ts";

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

	return div(
		{ class: "wrapper" },
		//
		Header(),
		Hero(completed, total),
		Form(),
		List(todos),
	);
}
