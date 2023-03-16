export const STATE = Symbol("@hyperactive/state");

export type Subscriber<T> = (val: T) => void;

export namespace State {
	// deno-lint-ignore no-explicit-any
	export type SimpleRO<T = any> = {
		init: T;
		listen: (f: Subscriber<T>) => void;
		map: <U, Mapper extends (t: T) => U>(f: Mapper) => ReturnType<Simple<U>["readonly"]>;
		[STATE]: true;
	};

	// deno-lint-ignore no-explicit-any
	export type Simple<T = any> = SimpleRO<T> & {
		publish: (next: T) => void;
		readonly: () => SimpleRO<T>;
	};

	export const isState = (n: any): n is State.Simple | State.SimpleRO => Boolean(n[STATE]);

	export function simple<T>(init: T): Simple<T> {
		const subscribers: Subscriber<T>[] = [];

		const publish: Simple<T>["publish"] = next =>
			Promise.resolve(next).then(val => subscribers.forEach(subscriber => subscriber(val)));

		const listen: Simple<T>["listen"] = f => subscribers.push(f);

		const map: Simple<T>["map"] = f => {
			const s = simple<ReturnType<typeof f>>(f(init) as ReturnType<typeof f>);
			listen(value => s.publish(f(value) as ReturnType<typeof f>));
			return s.readonly();
		};

		const readonly: Simple<T>["readonly"] = () => ({
			init,
			listen,
			map,
			[STATE]: true,
		});

		return { init, publish, listen, map, readonly, [STATE]: true };
	}
}

// deno-lint-ignore no-explicit-any
export const isState = State.isState;

export default State;
