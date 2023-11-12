import { Keyof as K } from "./util.ts";

type StateEntries<Obj extends Record<string, State>> = { [k in K<Obj>]: { key: k; value: Obj[k]["value"] } }[K<Obj>];
type MapEntries<Rs extends State[]> = { [k in keyof Rs]: { key: k; value: Rs[k]["value"] } }[number];

export type Subscriber<T> = (value: T, unused?: unknown) => void;
export type KeyedSubscriber<K extends { key: unknown; value: unknown }> = (value: K["value"], key: K["key"]) => void;
export type StateType<R extends State> = R extends State<infer U> ? U : never;

export class ReadonlyState<T = any> {
	protected subscribers: Subscriber<T>[] = [];

	constructor(public value: T) {}

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
	constructor(value: T) {
		super(value);
	}

	/**
	 * Merge multiple states into a single state
	 */
	static merge<T>(...states: [State<T>, ...State<T>[]]): MergedState<MapEntries<State<T>[]>>;

	static merge<RefMap extends { [k: string]: State }>(refs: RefMap): MergedState<StateEntries<RefMap>>;

	static merge<T, RefMap extends { [k: string]: State }>(
		...refs: [State<T> | RefMap, ...State<T>[]]
	): State<T> | MergedState<MapEntries<State<T>[]>> | MergedState<StateEntries<RefMap>> {
		if (State.isState(refs[0])) {
			const ref = new MergedState<MapEntries<State<T>[]>>(refs[0].value);
			for (let i = 0; i < refs.length; i++) {
				const r = refs[i] as State<T>;
				r.listen(x => ref.publish(x, i));
			}
			return ref;
		} else {
			const ref = new MergedState<StateEntries<RefMap>>(null);
			const rs = refs[0];
			for (const r in rs) rs[r].listen(c => ref.publish(c, r));
			return ref;
		}
	}

	publish(next: T | Promise<T>, unused?: unknown) {
		return Promise.resolve(next).then(val => {
			this.value = val;
			this.subscribers.forEach(subscriber => subscriber(val));
		});
	}

	readonly() {
		return new ReadonlyState(this.value);
	}
}

export class MergedState<T extends { key: string | number; value: unknown }> extends State<T["value"]> {
	// @ts-expect-error
	protected subscribers: KeyedSubscriber<T>[];

	listen(listener: KeyedSubscriber<T>): void {
		this.subscribers.push(listener);
	}

	publish(value: T["value"] | Promise<T["value"]>, key: T["key"]) {
		return Promise.resolve(value).then(val => {
			this.value = val;
			this.subscribers.forEach(subscriber => subscriber(val, key));
		});
	}
}
