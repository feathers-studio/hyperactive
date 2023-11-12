export type Subscriber<T> = (value: T) => void;

type MergedStateValue<Obj extends Record<string, State>> = {
	[key in keyof Obj]: [key: key, value: Obj[key]["value"]];
}[keyof Obj];

export interface ReadonlyState<T = any> {
	value: T;
	listen(listener: Subscriber<T>): void;
	map<U>(mapper: (t: T) => U): ReadonlyState<U>;
	into(state: State<T>): void;
}

const StateSymbol = Symbol("@hyperactive/state");

export class State<T = any> implements ReadonlyState<T> {
	#subscribers: Subscriber<T>[] = [];
	#state: { value: T };
	[StateSymbol] = true;

	constructor(value: T) {
		const state = { value };
		this.#state = state;
	}

	get value(): T {
		return this.#state.value;
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
			const merged = new State<[number, T]>([0, states[0].value]);
			for (let index = 0; index < states.length; index++) {
				const state = states[index] as State<T>;
				state.listen(updated => merged.publish([index, updated]));
			}
			return merged.readonly();
		} else {
			const obj = states[0];
			type MergedValue = MergedStateValue<RefMap>;
			const merged = new State<MergedValue>(Object.values(obj)[0]?.value);
			for (const key in obj) obj[key].listen(updated => merged.publish([key, updated]));
			return merged.readonly();
		}
	}

	publish(next: T | Promise<T>) {
		return Promise.resolve(next).then(val => {
			this.#state.value = val;
			this.#subscribers.forEach(subscriber => subscriber(val));
		});
	}

	listen(listener: Subscriber<T>) {
		this.#subscribers.push(listener);
	}

	map<U>(mapper: (t: T) => U): ReadonlyState<U> {
		const s = new State(mapper(this.value));
		// publish mapped changes when value changes
		this.listen(value => s.publish(mapper(value)));
		// return readonly so mapped state can't be published into
		return s.readonly();
	}

	into(state: State<T>) {
		this.listen(value => state.publish(value));
	}

	readonly() {
		const it = this;
		return {
			get value(): T {
				return it.value;
			},
			listen: this.listen.bind(this),
			map: this.map.bind(this),
			into: this.into.bind(this),
			[StateSymbol]: true,
		};
	}
}
