export type Subscriber = (value: any) => void;

type MergedStateValue<Obj extends Record<string, State>> = {
	[key in keyof Obj]: [key: key, value: ReturnType<Obj[key]["get"]>];
}[keyof Obj];

const StateSymbol = Symbol("@hyperactive/state");

export class ReadonlyState<T = any> {
	#subscribers: Subscriber[] = [];
	#state: { value: T };
	[StateSymbol] = true as true;

	constructor(value: T) {
		this.#state = { value };
	}

	get(): T {
		return this.#state.value;
	}

	listen(listener: (value: T) => void) {
		this.#subscribers.push(listener);
	}

	transform<U>(transformer: (t: T) => U): ReadonlyState<U> {
		const s = new State(transformer(this.get()));
		// publish transformed changes when value changes
		this.listen(value => s.set(transformer(value)));
		// return readonly so transformed state can't be published into
		return s.readonly();
	}

	into(state: State<T>) {
		this.listen(value => state.set(value));
	}

	static isState<X>(x: X): x is Extract<X, State | ReadonlyState> {
		return x && typeof x === "object" && StateSymbol in x;
	}

	/**
	 * Merge multiple states into a single state
	 */
	static merge<T>(...states: [State<T>, ...State<T>[]]): State<[number, T]>;

	static merge<RefMap extends { [k: string]: State }>(refs: RefMap): State<MergedStateValue<RefMap>>;

	static merge<T, RefMap extends { [k: string]: State }>(
		...states: [State<T> | RefMap, ...State<T>[]]
	): ReadonlyState<[number, T]> | ReadonlyState<MergedStateValue<RefMap>> {
		if (State.isState(states[0])) {
			const merged = new State<[number, T]>([0, states[0].get()]);
			for (let index = 0; index < states.length; index++) {
				const state = states[index] as State<T>;
				state.listen(updated => merged.set([index, updated]));
			}
			return merged.readonly();
		} else {
			const obj = states[0];
			type MergedValue = MergedStateValue<RefMap>;
			const merged = new State<MergedValue>(Object.values(obj)[0]?.get());
			for (const key in obj) obj[key].listen(updated => merged.set([key, updated]));
			return merged.readonly();
		}
	}
}

export class State<T = any> extends ReadonlyState<T> {
	#subscribers: Subscriber[] = [];
	#state: { value: T };

	constructor(value: T) {
		super(value);
		this.#state = { value };
	}

	set(next: T | Promise<T>) {
		return Promise.resolve(next).then(val => {
			this.#state.value = val;
			this.#subscribers.forEach(subscriber => subscriber(val));
		});
	}

	readonly(): ReadonlyState<T> {
		return new ReadonlyState(this.get());
	}
}
