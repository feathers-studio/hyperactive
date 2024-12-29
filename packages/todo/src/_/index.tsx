// @ts-nocheck test
/* eslint-disable */

{
	// Hyperactive function version (current)

	const Todo = (todo: State<{ id: number; content: string }>) => {
		const state = new State(todo.value.content);

		return li(
			span(todo.index.transform(i => String(i + 1))),
			form(
				p(todo.transform(t => t.content)),
				input({ type: "text", value: state, on: { change: e => state.update(e.target.value) } }),
				button({
					on: {
						async click() {
							await fetch("...", {
								method: "PUT",
								body: JSON.stringify({ value: state.value }),
							});
							todo.update({ ...todo, content: state.value });
						},
					},
				}),
			),
		);
	};

	const App = () => {
		const todos = new ListState([
			{ id: 1, content: "Hyperactive" },
			{ id: 2, content: "Jigza" },
			{ id: 3, content: "Telegraf" },
		]);

		return div(
			{ class: "container" },
			ol(todos.transform(Todo)),
			button({ on: { click: () => todos.push({ id: todos.length + 1, content: "" }) } }, "Add"),
		);
	};

	renderDOM(root, App());
}

{
	// Hyperactive JSX version (future)

	type Todo = { id: number; content: string };

	const Todo = ({ list, todo }: { list: ListState<Todo>; todo: ListMember<Todo> }) => {
		const state = new State(todo.content);

		return (
			<li>
				<span>{todo.index.transform(i => String(i + 1))}</span>
				<form>
					<p>{todo.transform(t => t.content)}</p>
					<input type="text" value={state} onChange={e => state.update(e.target.value)} />
					<button
						onClick={async function () {
							await fetch("...", { method: "PUT", body: JSON.stringify({ value: state.value }) });
							todo.update({ ...todo, content: state.value });
						}}>
						Add
					</button>
				</form>
			</li>
		);
	};

	const App = () => {
		const todos = new ListState([
			{ id: 1, content: "Hyperactive" },
			{ id: 2, content: "Jigza" },
			{ id: 3, content: "Telegraf" },
		]);

		return (
			<div className="container">
				<ol>
					{todos.transform(todo => (
						<Todo key={todo.id} todo={todo} setList={todos.update} />
					))}
				</ol>
				<button onClick={() => todos.push({ id: todos.length + 1, content: "" })}>Add</button>
			</div>
		);
	};

	renderDOM(root, <App />);
}

{
	// React version

	const Todo = ({ setList, todo, index }: { setList: (list: { id: number; content: string }[]) => void; todo: { id: number; content: string }; index: number }) => {
		const [value, setValue] = useState(todo.content);

		return (
			<li>
				<span>{index + 1}</span>
				<form>
					<p>{todo.content}</p>
					<input type="text" value={value} onChange={e => setValue(e.target.value)} />
					<button
						onClick={async () => {
							await fetch("...", { method: "PUT", body: JSON.stringify({ value: value }) });
							setList(prev => [...prev, { id: prev.length + 1, content: value }]);
						}}>
						Add
					</button>
				</form>
			</li>
		);
	};

	const App = () => {
		const [todos, setTodos] = useState([
			{ id: 1, content: "Hyperactive" },
			{ id: 2, content: "Jigza" },
			{ id: 3, content: "Telegraf" },
		]);

		return (
			<div className="container">
				<ol>
					{todos.map((todo, index) => (
						<Todo key={todo.id} setList={setTodos} todo={todo} index={index} />
					))}
				</ol>
				<button onClick={() => setTodos(prev => [...prev, { id: prev.length + 1, content: "" }])}>Add</button>
			</div>
		);
	};

	createRoot(root).render(App);
}
