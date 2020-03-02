export const isObject = (x: any): x is object => x && typeof x === "object";

export const isIterable = <T>(x: any): x is Iterable<T> =>
	x && typeof x === "object" && typeof (x[Symbol.iterator] as any) === "function";

export function* flatCat<T>(...xs: (T | Iterable<T>)[]): Iterable<T> {
	for (const x of xs) {
		if (isIterable(x)) {
			yield* flatCat(...x);
		} else yield x;
	}
}

export function* map<T, U>(f: (x: T) => U, xs: Iterable<T>) {
	for (const x of xs) {
		yield f(x);
	}
}

export function collect<T>(iter: Iterable<T>) {
	return [...iter];
}
