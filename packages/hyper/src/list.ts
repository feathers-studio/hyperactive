import { ReadonlyState, State } from "./state.ts";
import { unreachable } from "./util.ts";

export class ReadonlyListMember<T> extends ReadonlyState<T> {
	#parent: ReadonlyListState<T>;
	#index: number;

	constructor(parent: ReadonlyListState<T>, index: number, value: T) {
		super(value);
		this.#parent = parent;
		this.#index = index;
	}

	get parent(): ReadonlyListState<T> {
		return this.#parent;
	}

	get index(): number {
		return this.#index;
	}
}

export class ListMember<T> extends State<T> {
	#parent: ListState<T>;
	#index: number;

	constructor(parent: ListState<T>, index: number, value: T) {
		super(value);
		this.#parent = parent;
		this.#index = index;
	}

	get parent(): ListState<T> {
		return this.#parent;
	}

	get index(): number {
		return this.#index;
	}
}

const enum ListEventType {
	Insert = "insert",
	Remove = "remove",
	Replace = "replace",
	Update = "update",
}

type ListEvent =
	| { type: ListEventType.Insert; index: number; value: any; array: any[] }
	| { type: ListEventType.Remove; index: number; value: any; array: any[] }
	| { type: ListEventType.Replace; index: number; value: any; oldValue: any; array: any[] }
	| { type: ListEventType.Update; newValue: any[]; array: any[] };

const transformFromEvent =
	<T, U>(target: ListState<U>, transformer: (value: T, index: number) => U) =>
	(update: ListEvent) => {
		switch (update.type) {
			case ListEventType.Insert:
				target.insert(update.index, transformer(update.value, update.index));
				break;
			case ListEventType.Remove:
				target.remove(update.index);
				break;
			case ListEventType.Replace:
				target.replace(update.index, transformer(update.value, update.index));
				break;
			case ListEventType.Update:
				target.update(update.newValue.map(transformer));
				break;
			default:
				unreachable(update);
		}
	};

abstract class ListStateBase<T> {
	protected state: State<T[]>;
	protected _length: State<number>;
	protected listeners: ((event: ListEvent) => void)[] = [];

	constructor(initial: Iterable<T> = []) {
		this.state = new State([...initial]);
		this._length = new State(this.state.value.length);
	}

	size(): State<number> {
		return this._length;
	}

	static isListState<T>(value: any): value is ListState<T> | ReadonlyListState<T> {
		return value instanceof ReadonlyListState || value instanceof ListState;
	}

	listen(listener: (event: ListEvent) => void) {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter(l => l !== listener);
		};
	}

	filter(callbackFn: (value: T, index: number, array: T[]) => boolean): ListState<T> {
		const filtered = new ListState<T>(this.state.value.filter(callbackFn));
		// TODO: we should somehow translate the events from the original list to the filtered list
		// This involves mapping the index of the event to the index of the filtered list
		this.listen(update => filtered.update(update.array.filter(callbackFn)));
		return filtered;
	}

	*[Symbol.iterator]() {
		for (const value of this.state.value) {
			yield value;
		}
	}

	toArray(): T[] {
		return [...this];
	}
}

export class ReadonlyListState<T> extends ListStateBase<T> {
	each<U>(modifier: (value: ReadonlyListMember<T>) => U): ReadonlyListState<U> {
		const mf = (value: T, index: number) => modifier(new ReadonlyListMember(this, index, value));
		const target = new ListState<U>(this.state.value.map(mf));
		this.listen(transformFromEvent(target, mf));
		return target.readonly();
	}
}

export class ListState<T> extends ListStateBase<T> {
	private notify(event: ListEvent) {
		for (const listener of this.listeners) {
			listener(event);
		}
	}

	each<U>(modifier: (value: ListMember<T>) => U): ReadonlyListState<U> {
		const mf = (value: T, index: number) => modifier(new ListMember(this, index, value));
		const target = new ListState<U>(this.state.value.map(mf));
		this.listen(transformFromEvent(target, mf));
		return target.readonly();
	}

	update(values: Iterable<T>) {
		const newValue = [...values];
		this.state.update(newValue);
		this.notify({ type: ListEventType.Update, newValue, array: this.state.value });
	}

	pop(): T | undefined {
		const array = this.state.value;
		const popped = array.pop();
		if (popped !== undefined) {
			this.state.update(array);
			this.notify({ type: ListEventType.Remove, index: array.length, value: popped, array });
		}
		return popped;
	}

	push(...items: T[]): number {
		const array = this.state.value;
		const startIndex = array.length;
		const length = array.push(...items);
		this.state.update(array);
		items.forEach((item, i) => {
			this.notify({ type: ListEventType.Insert, index: startIndex + i, value: item, array });
		});
		return length;
	}

	shift(): T | undefined {
		const array = this.state.value;
		const shifted = array.shift();
		if (shifted !== undefined) {
			this.state.update(array);
			this.notify({ type: ListEventType.Remove, index: 0, value: shifted, array });
		}
		return shifted;
	}

	unshift(...items: T[]): number {
		const array = this.state.value;
		const length = array.unshift(...items);
		this.state.update(array);
		items.forEach((value, index) => {
			this.notify({ type: ListEventType.Insert, index, value, array });
		});
		return length;
	}

	replace(index: number, value: T): ListState<T> {
		const array = this.state.value;
		const oldValue = array[index];
		array[index] = value;
		this.state.update(array);
		this.notify({ type: ListEventType.Replace, index, oldValue, value, array });
		return this;
	}

	insert(index: number, value: T): ListState<T> {
		const array = this.state.value;
		array.splice(index, 0, value);
		this.state.update(array);
		this.notify({ type: ListEventType.Insert, index, value, array });
		return this;
	}

	remove(index: number): ListState<T> {
		const array = this.state.value;
		const [removed] = array.splice(index, 1);
		this.state.update(array);
		if (removed !== undefined) {
			this.notify({ type: ListEventType.Remove, index, value: removed, array });
		}
		return this;
	}

	readonly(): ReadonlyListState<T> {
		return new ReadonlyListState(this.state.value);
	}
}
