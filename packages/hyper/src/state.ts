export type Subscriber = (value: any) => void;

type ComposedStateValue<Obj extends Record<string, State>> = {
	[key in keyof Obj]: Obj[key]["value"];
};

export class ReadonlyState<T = any> {
	protected subscribers: Subscriber[] = [];
	protected state: { value: T };

	constructor(value: T, private source?: ReadonlyState<T>) {
		this.state = { value };
		if (source) source.listen(value => (this.state.value = value));
	}

	get value(): T {
		return this.state.value;
	}

	transform<U>(transformer: (t: T) => U): ReadonlyState<U> {
		const s = new State(transformer(this.value));
		// publish transformed changes when value changes
		this.listen(value => s.set(transformer(value)));
		// return readonly so transformed state can't be published into
		return s.readonly();
	}

	pipe(state: State<T>) {
		this.listen(value => state.set(value));
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
			refs[key].listen(updated => merged.setWith(value => ({ ...value, [key]: updated })));
		}

		return merged.readonly();
	}

	if(predicate: (value: T) => boolean): ReadonlyState<T | null> {
		const filtered = new State<T | null>(predicate(this.value) ? this.value : null);
		this.listen(value => {
			if (predicate(value)) filtered.set(value);
		});
		return filtered.readonly();
	}

	debounce(ms: number): ReadonlyState<T> {
		const debounced = new State<T>(this.value);
		let timeout: ReturnType<typeof setTimeout>;

		this.listen(value => {
			clearTimeout(timeout);
			timeout = setTimeout(() => debounced.set(value), ms);
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

	set(next: T) {
		if (this.state.value === next) return this.value;
		this.state.value = next;
		this.subscribers.forEach(subscriber => subscriber(this.value));
		return this.value;
	}

	setWith(updater: (value: T) => T) {
		return this.set(updater(this.value));
	}

	readonly(): ReadonlyState<T> {
		return new ReadonlyState(this.value, this);
	}
}
