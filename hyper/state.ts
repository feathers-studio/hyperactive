export type Subscriber<T> = (value: T) => void;

type MergedStateValue<Obj extends Record<string, State>> = {
	[key in keyof Obj]: [key: key, value: Obj[key]["value"]];
}[keyof Obj];

export class ReadonlyState<T = any> {
	protected subscribers: Subscriber<T>[] = [];
	#state: { value: T };

	constructor(state: { value: T }) {
		this.#state = state;
	}

	get value(): T {
		return this.#state.value;
	}

	static isState<X>(x: X): x is Extract<X, State | ReadonlyState> {
		return x instanceof ReadonlyState;
	}

	listen(listener: Subscriber<T>) {
		this.subscribers.push(listener);
	}

	map<U>(mapper: (t: T) => U) {
		const s = new State(mapper(this.value));
		// publish mapped changes when value changes
		this.listen(value => s.publish(mapper(value)));
		// return readonly so mapped state can't be published into
		return s.readonly();
	}

	into(state: State<T>) {
		this.listen(value => state.publish(value));
	}
}

export class State<T = any> extends ReadonlyState<T> {
	#state: { value: T };

	constructor(value: T) {
		const state = { value };
		super(state);
		this.#state = state;
	}

	/**
	 * Merge multiple states into a single state
	 */
	static merge<T>(...states: [State<T>, ...State<T>[]]): State<[number, T]>;

	static merge<RefMap extends { [k: string]: State }>(refs: RefMap): State<MergedStateValue<RefMap>>;

	static merge<T, RefMap extends { [k: string]: State }>(
		...states: [State<T> | RefMap, ...State<T>[]]
	): State<T> | State<[number, T]> | State<MergedStateValue<RefMap>> {
		if (State.isState(states[0])) {
			const merged = new State<[number, T]>([0, states[0].value]);
			for (let index = 0; index < states.length; index++) {
				const state = states[index] as State<T>;
				state.listen(updated => merged.publish([index, updated]));
			}
			return merged;
		} else {
			const obj = states[0];
			type MergedValue = MergedStateValue<RefMap>;
			const merged = new State<MergedValue>(Object.values(obj)[0]?.value);
			for (const key in obj) obj[key].listen(updated => merged.publish([key, updated]));
			return merged;
		}
	}

	publish(next: T | Promise<T>) {
		return Promise.resolve(next).then(val => {
			this.#state.value = val;
			this.subscribers.forEach(subscriber => subscriber(val));
		});
	}

	readonly() {
		return new ReadonlyState(this.#state);
	}
}
