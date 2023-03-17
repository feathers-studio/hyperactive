export type Subscriber<T> = (val: T) => void;

export class ReadonlyRef<T = any> {
	protected subscribers: Subscriber<T>[] = [];

	constructor(public value: T) {}

	listen(f: Subscriber<T>) {
		this.subscribers.push(f);
	}

	map<U>(mapper: (t: T) => U) {
		const s = new Ref(mapper(this.value));
		// publish mapped changes when value changes
		this.listen(value => s.publish(mapper(value)));
		// return readonly so mapped state can't be published into
		return s.readonly();
	}

	effect(effector: (t: T) => void) {
		// trigger effect when value changes
		this.listen(effector);
	}

	into(state: Ref<T>) {
		this.listen(value => state.publish(value));
	}
}

export class Ref<T = any> extends ReadonlyRef<T> {
	constructor(value: T) {
		super(value);
	}

	static isRef<X>(x: X): x is Extract<X, Ref | ReadonlyRef> {
		return x instanceof ReadonlyRef;
	}

	publish(next: T | Promise<T>) {
		return Promise.resolve(next).then(val => {
			this.value = val;
			this.subscribers.forEach(subscriber => subscriber(val));
		});
	}

	readonly() {
		return new ReadonlyRef(this.value);
	}
}
