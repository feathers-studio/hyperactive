export type Subscriber = (value: any) => void;

type MergedStateValue<Obj extends Record<string, State>> = {
	[key in keyof Obj]: [key: key, value: ReturnType<Obj[key]["value"]>];
}[keyof Obj];

const StateSymbol = Symbol("@hyperactive/state");

export class ReadonlyState<T = any> {
	#subscribers: Subscriber[] = [];
	#state: { value: T };
	[StateSymbol] = true as true;

	constructor(value: T) {
		this.#state = { value };
	}

	get value(): T {
		return this.#state.value;
	}

	map<U>(mapper: (t: T) => U): ReadonlyState<U> {
		const s = new State(mapper(this.value));
		// publish transformed changes when value changes
		this.listen(value => s.update(mapper(value)));
		// return readonly so transformed state can't be published into
		return s.readonly();
	}

	into(state: State<T>) {
		this.listen(value => state.update(value));
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
			const merged = new State<[number, T]>([0, states[0].value()]);
			for (let index = 0; index < states.length; index++) {
				const state = states[index] as State<T>;
				state.listen(updated => merged.update([index, updated]));
			}
			return merged.readonly();
		} else {
			const obj = states[0];
			type MergedValue = MergedStateValue<RefMap>;
			const merged = new State<MergedValue>(Object.values(obj)[0]?.value());
			for (const key in obj) obj[key].listen(updated => merged.update([key, updated]));
			return merged.readonly();
		}
	}

	filter(predicate: (value: T) => boolean): ReadonlyState<T> {
		const filtered = new State<T>(this.value);
		this.listen(value => {
			if (predicate(value)) {
				filtered.update(value);
			}
		});
		return filtered.readonly();
	}

	debounce(ms: number): ReadonlyState<T> {
		const debounced = new State<T>(this.value);
		let timeout: ReturnType<typeof setTimeout>;

		this.listen(value => {
			clearTimeout(timeout);
			timeout = setTimeout(() => debounced.update(value), ms);
		});

		return debounced.readonly();
	}

	listen(listener: (value: T) => void): () => void {
		this.#subscribers.push(listener);
		// Return cleanup function
		return () => {
			const index = this.#subscribers.indexOf(listener);
			if (index > -1) this.#subscribers.splice(index, 1);
		};
	}
}

export class State<T = any> extends ReadonlyState<T> {
	#subscribers: Subscriber[] = [];
	#state: { value: T };

	constructor(value: T) {
		super(value);
		this.#state = { value };
	}

	update(next: T | Promise<T>) {
		return Promise.resolve(next).then(val => {
			this.#state.value = val;
			this.#subscribers.forEach(subscriber => subscriber(val));
		});
	}

	readonly(): ReadonlyState<T> {
		return new ReadonlyState(this.value);
	}
}
