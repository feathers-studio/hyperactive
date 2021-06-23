export const STATE = Symbol("@hyperactive/state");

export type Subscriber<T> = (val: T) => void;

export type SimpleStateRO<T = unknown> = {
	init: T;
	subscribe: (f: Subscriber<T>) => void;
	map: <U, Mapper extends (t: T) => U>(
		f: Mapper,
	) => ReturnType<SimpleState<U>["readonly"]>;
	[STATE]: true;
};

export type SimpleState<T = unknown> = SimpleStateRO<T> & {
	publish: (next: T) => void;
	readonly: () => SimpleStateRO<T>;
};

// deno-lint-ignore no-explicit-any
export const isState = (n: any): n is SimpleState | SimpleStateRO =>
	Boolean(n[STATE]);

const SimpleState = <T>(init: T): SimpleState<T> => {
	const subscribers: Subscriber<T>[] = [];

	const publish: SimpleState<T>["publish"] = next =>
		Promise.resolve(next).then(val =>
			subscribers.forEach(subscriber => subscriber(val)),
		);

	const subscribe: SimpleState<T>["subscribe"] = f => subscribers.push(f);

	const map: SimpleState<T>["map"] = f => {
		const s = SimpleState<ReturnType<typeof f>>(
			f(init) as ReturnType<typeof f>,
		);
		subscribe(value => s.publish(f(value) as ReturnType<typeof f>));
		return s.readonly();
	};

	const readonly: SimpleState<T>["readonly"] = () => ({
		init,
		subscribe,
		map,
		[STATE]: true,
	});

	return { init, publish, subscribe, map, readonly, [STATE]: true };
};

export const State = { simple: SimpleState };
