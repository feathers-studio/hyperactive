export type Subscriber = (value: any) => void;

type ComposedStateValue<Obj extends Record<string, State>> = {
	[key in keyof Obj]: Obj[key]["value"];
};

const StateSymbol = Symbol("@hyperactive/state");

export class ReadonlyState<T = any> {
	[StateSymbol] = true as true;

	protected subscribers: Subscriber[] = [];
	protected state: { value: T };

	constructor(value: T, private source?: ReadonlyState<T>) {
		this.state = { value };
	}

	get value(): T {
		return this.state.value;
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

	static isState(x: any): x is State | ReadonlyState {
		return x instanceof State || x instanceof ReadonlyState;
	}

	/**
	 * Compose multiple states into a single state
	 */
	static compose<RefMap extends { [k: string]: State }>(refs: RefMap): ReadonlyState<ComposedStateValue<RefMap>> {
		type Composed = ComposedStateValue<RefMap>;

		// lazily initialised below
		const initialValue = {} as Composed;
		const merged = new State<Composed>(initialValue);

		for (const key in refs) {
			initialValue[key] = refs[key].value;
			refs[key].listen(updated => merged.updateWith(value => ({ ...value, [key]: updated })));
		}

		return merged.readonly();
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
		if (this.source) return this.source.listen(listener);

		this.subscribers.push(listener);
		// Return cleanup function
		return () => {
			const index = this.subscribers.indexOf(listener);
			if (index > -1) this.subscribers.splice(index, 1);
		};
	}
}

export class State<T = any> extends ReadonlyState<T> {
	constructor(value: T) {
		super(value);
	}

	update(next: T) {
		this.state.value = next;
		this.subscribers.forEach(subscriber => subscriber(this.value));
	}

	updateWith(updater: (value: T) => T) {
		this.state.value = updater(this.value);
		this.subscribers.forEach(subscriber => subscriber(this.value));
	}

	readonly(): ReadonlyState<T> {
		return new ReadonlyState(this.value, this);
	}
}
