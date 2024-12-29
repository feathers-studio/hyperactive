// // @ts-nocheck

// type Todo = { id: number; content: string };

// const Todo = (todo: ListMember<Todo>) => {
// 	const state = new State(todo.content);

// 	return (
// 		<li>
// 			<span>{todo.index.transform(i => String(i + 1))}</span>
// 			<form>
// 				<p>{todo.transform(t => t.content)}</p>
// 				<input type="text" value={state} onChange={e => state.update(e.target.value)} />
// 				<button
// 					onClick={async function() {
// 						await fetch("...", { method: "PUT", body: JSON.stringify({ value: state.value }) });
// 						todo.update({ ...todo, content: state.value });
// 					}}>
// 					Add
// 				</button>
// 			</form>
// 		</li>
// 	);
// };

// const App = () => {
// 	const todos = new ListState([
// 		{ id: 1, content: "Hyperactive" },
// 		{ id: 2, content: "Jigza" },
// 		{ id: 3, content: "Telegraf" },
// 	]);

// 	return (
// 		<div className="container">
// 			<ol>
// 				{todos.transform(todo => (
// 					<Todo key={todo.id} todo={todo} setList={todos.update} />
// 				))}
// 			</ol>
// 			<button onClick={() => todos.push({ id: todos.length + 1, content: "" })}>Add</button>
// 		</div>
// 	);
// };

// renderDOM(root, <App />);
