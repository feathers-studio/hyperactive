// // @ts-nocheck

// type Todo = { id: number; content: string };

// const Todo = ({ setList, todo, index }: { setList: (list: Todo[]) => void; todo: Todo; index: number }) => {
// 	const [state, setState] = useState(todo.content);

// 	return (
// 		<li>
// 			<span>{index + 1}</span>
// 			<form>
// 				<p>{todo.content}</p>
// 				<input type="text" value={state} onChange={e => setState(e.target.value)} />
// 				<button
// 					onClick={async function() {
// 						await fetch("...", { method: "PUT", body: JSON.stringify({ value: state }) });
// 						setList(prev => [...prev, { id: prev.length + 1, content: state }]);
// 					}}>
// 					Add
// 				</button>
// 			</form>
// 		</li>
// 	);
// };

// const App = () => {
// 	const [todos, setTodos] = useState<Todo[]>([
// 		{ id: 1, content: "Hyperactive" },
// 		{ id: 2, content: "Jigza" },
// 		{ id: 3, content: "Telegraf" },
// 	]);

// 	return (
// 		<div className="container">
// 			<ol>
// 				{todos.map((todo, index) => (
// 					<Todo key={todo.id} setList={setTodos} todo={todo} index={index} />
// 				))}
// 			</ol>
// 			<button onClick={() => setTodos(prev => [...prev, { id: prev.length + 1, content: "" }])}>Add</button>
// 		</div>
// 	);
// };

// createRoot(root).render(App);
