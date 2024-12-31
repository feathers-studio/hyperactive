import { ReadonlyState, State } from "./state.ts";
import { unreachable } from "./util.ts";

export class Member<T> extends State<T> {
	parent: List<T>;
	index: State<number>;
	next: Member<T> | null = null;
	prev: Member<T> | null = null;

	constructor({
		parent,
		index,
		value,
		next,
		prev,
	}: {
		parent: List<T>;
		index: number;
		value: T;
		next: Member<T> | null;
		prev: Member<T> | null;
	}) {
		super(value);
		this.parent = parent;
		this.index = new State(index);
		this.next = next;
		this.prev = prev;
	}

	remove() {
		this.parent.removeMember(this);
	}

	replace(value: T) {
		this.parent.replaceMember(this, value);
	}

	iterateFromMe(): Iterable<Member<T>> {
		const member = this;
		return {
			*[Symbol.iterator](): IterableIterator<Member<T>> {
				let current: Member<T> | null = member;
				while (current) {
					yield current;
					current = current.next;
				}
			},
		};
	}

	readonly(): ReadonlyMember<T> {
		return new ReadonlyMember(this);
	}
}

class ReadonlyMember<T> extends ReadonlyState<T> {
	parent: ReadonlyList<T>;
	index: ReadonlyState<number>;

	constructor(member: Member<T>, parent?: ReadonlyList<T>) {
		super(member.value, member);
		this.parent = parent ?? member.parent.readonly();
		this.index = member.index.readonly();
	}
}

const enum ListEventKind {
	Append = "append",
	Prepend = "prepend",
	Insert = "insert",
	Remove = "remove",
	Replace = "replace",
	Swap = "swap",
	Update = "update",
}

type ListEvent =
	| { type: ListEventKind.Append; member: Member<any>; list: List<any> }
	| { type: ListEventKind.Prepend; member: Member<any>; list: List<any> }
	| { type: ListEventKind.Insert; member: Member<any>; list: List<any> }
	| { type: ListEventKind.Remove; member: Member<any>; list: List<any> }
	| { type: ListEventKind.Replace; member: Member<any>; old: Member<any>; list: List<any> }
	| { type: ListEventKind.Swap; a: Member<any>; b: Member<any>; list: List<any> }
	| { type: ListEventKind.Update; list: List<any> };

export class List<T> {
	/** @internal */
	first: Member<T> | null = null;
	/** @internal */
	last: Member<T> | null = null;

	size: State<number> = new State(0);

	/** @internal */
	protected listeners: ((event: ListEvent) => void)[] = [];

	set(values: Iterable<T>) {
		this.first = null;
		this.last = null;

		let prev: Member<T> | null = null;
		let index = 0;
		for (const value of values) {
			const member: Member<T> = new Member({
				parent: this,
				index,
				value,
				next: null,
				prev,
			});

			if (!this.first) this.first = member;
			if (prev) prev.next = member;
			prev = member;
			index++;
		}
		this.last = prev;
		this.size.set(index);

		this.notify({ type: ListEventKind.Update, list: this });
	}

	constructor(initial: Iterable<T> = []) {
		// TODO: perhaps this could be lazy?
		this.set(initial);
	}

	static isList<T>(value: any): value is List<T> {
		return value instanceof List || value instanceof ReadonlyList;
	}

	static isReadonly<T>(value: any): value is ReadonlyList<T> {
		return value instanceof ReadonlyList;
	}

	*[Symbol.iterator](): IterableIterator<Member<T>> {
		let current = this.first;
		while (current) {
			yield current;
			current = current.next;
		}
	}

	/** @internal */
	updateIndices(): number {
		let index = 0;
		for (const member of this) member.index.set(index++);
		return this.size.set(index);
	}

	removeMember(member: Member<T>): number {
		if (member.prev) member.prev.next = member.next;
		if (member.next) member.next.prev = member.prev;

		if (this.first === member) this.first = member.next;
		if (this.last === member) this.last = member.prev;

		// update the indices of the remaining members
		this.updateIndices();

		member.parent.notify({ type: ListEventKind.Remove, member, list: member.parent });
		return this.size.value;
	}

	replaceMember(member: Member<T>, value: T) {
		const newMember = new Member({
			parent: this,
			index: member.index.value,
			value,
			next: member.next,
			prev: member.prev,
		});

		if (member.prev) member.prev.next = newMember;
		if (member.next) member.next.prev = newMember;

		if (this.first === member) this.first = newMember;
		if (this.last === member) this.last = newMember;

		this.notify({ type: ListEventKind.Replace, member: newMember, old: member, list: this });
	}

	append(value: T): Member<T> {
		const member = new Member({
			parent: this,
			index: this.size.value,
			value: value,
			next: null,
			prev: this.last,
		});

		if (this.last) this.last.next = member;
		// this is going to be the only member in the list
		if (!this.first) this.first = member;
		this.last = member;

		this.size.set(this.size.value + 1);
		this.notify({ type: ListEventKind.Append, member, list: this });
		return member;
	}

	prepend(value: T): Member<T> {
		const member = new Member({
			parent: this,
			index: 0,
			value: value,
			next: this.first,
			prev: null,
		});

		if (this.first) this.first.prev = member;
		// this is going to be the only member in the list
		if (!this.last) this.last = member;
		this.first = member;

		// since top of the list was changed, we need to update all indices
		this.updateIndices();
		this.notify({ type: ListEventKind.Prepend, member, list: this });
		return member;
	}

	pop(): T | undefined {
		const last = this.last;
		if (last) {
			if (last.prev) last.prev.next = null;
			this.last = last.prev;
			if (this.first === last) this.first = this.last;
			this.size.set(this.size.value - 1);
			this.notify({ type: ListEventKind.Remove, member: last, list: this });
			return last.value;
		}
	}

	shift(): T | undefined {
		const first = this.first;
		if (first) {
			if (first.next) first.next.prev = null;
			this.first = first.next;
			if (this.last === first) this.last = this.first;
			this.updateIndices();
			this.notify({ type: ListEventKind.Remove, member: first, list: this });
			return first.value;
		}
	}

	/** @escapes This function escapes the list and returns a plain array. The result is not reactive. */
	toArray(): T[] {
		const array: T[] = [];
		for (const member of this) array.push(member.value);
		return array;
	}

	/** @internal */
	assertIndexLow(index: number) {
		if (index < 0) throw new RangeError("Index must be non-negative");
	}

	/** @internal */
	assertIndexHigh(index: number) {
		if (index >= this.size.value) throw new RangeError("Index is out of bounds");
	}

	/** @internal */
	assertIndexInBounds(index: number) {
		this.assertIndexLow(index);
		this.assertIndexHigh(index);
	}

	find(value: T): Member<T> | undefined {
		let current = this.first;
		while (current) {
			if (current.value === value) return current;
			current = current.next;
		}
	}

	at(index: number, from: Member<T> | null = this.first): Member<T> | undefined {
		if (!from) return undefined;
		if (index < 0) index = this.size.value + index + 1;
		if (from.index.value > index) return undefined;
		let current: Member<T> | null = from;
		while (current) {
			if (current.index.value === index) return current;
			current = current.next;
		}
	}

	insertAt(index: number, value: T): T {
		this.assertIndexLow(index);
		// TODO: handle the case where the index is out of bounds
		// Consider whether sparse lists should be supported
		this.assertIndexHigh(index);

		const member = this.at(index);
		if (!member) throw new RangeError(`Could not find member at index ${index}. This is a bug.`);

		const newMember = new Member({ parent: this, index, value, next: member, prev: member.prev });

		if (member.prev) member.prev.next = newMember;
		member.prev = newMember;

		if (this.first === member) this.first = newMember;

		this.updateIndices();
		this.notify({ type: ListEventKind.Insert, member: newMember, list: this });
		return newMember.value;
	}

	removeAt(index: number): T {
		this.assertIndexInBounds(index);

		const member = this.at(index);
		if (!member) throw new RangeError(`Could not find member at index ${index}. This is a bug.`);

		this.removeMember(member);
		return member.value;
	}

	replaceAt(index: number, value: T): List<T> {
		this.assertIndexInBounds(index);

		const member = this.at(index);
		if (!member) throw new RangeError(`Could not find member at index ${index}. This is a bug.`);

		const newMember = new Member({ parent: this, index, value, next: member.next, prev: member.prev });

		// not using insertAt because it's O(n) while this is O(1)
		if (member.prev) member.prev.next = newMember;
		if (member.next) member.next.prev = newMember;

		// update the first and last members if necessary
		if (this.first === member) this.first = newMember;
		if (this.last === member) this.last = newMember;

		this.notify({ type: ListEventKind.Replace, member: newMember, old: member, list: this });
		return this;
	}

	swap(a: Member<T>, b: Member<T>) {
		if (a === b) return;

		const done = {
			a: {
				next: false,
				prev: false,
			},
			b: {
				next: false,
				prev: false,
			},
		};

		if (this.first === a) {
			this.first = b;
			a.next!.prev = b;
			done.a.next = true;
		}
		if (this.last === b) {
			this.last = a;
			b.prev!.next = a;
			done.b.prev = true;
		}
		if (this.first === b) {
			this.first = a;
			b.next!.prev = a;
			done.b.next = true;
		}
		if (this.last === a) {
			this.last = b;
			a.prev!.next = b;
			done.a.prev = true;
		}

		if (!done.a.prev) if (a.prev) a.prev.next = b;
		if (!done.a.next) if (a.next) a.next.prev = b;
		if (!done.b.prev) if (b.prev) b.prev.next = a;
		if (!done.b.next) if (b.next) b.next.prev = a;

		const aIndex = a.index.value;
		const bIndex = b.index.value;
		a.index.set(bIndex);
		b.index.set(aIndex);

		this.notify({ type: ListEventKind.Swap, a, b, list: this });
	}

	swapBetween(i: number, j: number) {
		this.assertIndexInBounds(i);
		this.assertIndexInBounds(j);

		const a = this.at(i);
		const b = this.at(j);
		if (a && b) this.swap(a, b);
	}

	moveTo(index: number, member: Member<T>) {
		this.assertIndexInBounds(index);

		const to = this.at(index);
		if (!to) throw new RangeError(`Could not find member at index ${index}. This is a bug.`);

		this.swap(member, to);
	}

	readonly(): ReadonlyList<T> {
		return new ReadonlyList(this);
	}

	listen(listener: (event: ListEvent) => void) {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter(l => l !== listener);
		};
	}

	/** @internal */
	notify(event: ListEvent) {
		for (const listener of this.listeners) listener(event);
	}

	// TODO: consider whether slice should react to source list changes
	/** The sliced list will not react to changes in the original list. */
	slice(start: number = 0, end: number = Infinity): ReadonlyList<T> {
		const sliced = new List<T>();
		if (start < 0) start = this.size.value + start + 1;
		if (end < 0) end = this.size.value + end + 1;
		let member = this.first;
		while (member) {
			if (member.index.value >= start) {
				sliced.append(member.value);
			} else if (member.index.value >= end) break;
			member = member.next;
		}

		return sliced.readonly();
	}

	reverse(): ReadonlyList<T> {
		const reversed = new List<T>();
		for (const member of this) reversed.prepend(member.value);

		this.listen(update => {
			switch (update.type) {
				case ListEventKind.Append:
					return reversed.prepend(update.member.value);
				case ListEventKind.Prepend:
					return reversed.append(update.member.value);
				case ListEventKind.Insert:
					return reversed.insertAt(reversed.size.value - update.member.index.value, update.member.value);
				case ListEventKind.Remove:
					return reversed.removeAt(reversed.size.value - update.member.index.value);
				case ListEventKind.Replace:
					return reversed.replaceAt(reversed.size.value - update.old.index.value, update.member.value);
				case ListEventKind.Swap:
					return reversed.swapBetween(update.a.index.value, update.b.index.value);
				case ListEventKind.Update:
					for (const member of this) reversed.prepend(member.value);
					return;
				default:
					unreachable(update);
			}
		});

		return reversed.readonly();
	}

	/** Like `Array#map`, but works on List Members instead of values. Returns a new List. */
	each<U>(modifier: (value: Member<T>) => U): ReadonlyList<U> {
		const target = new List<U>();
		for (const member of this) target.append(modifier(member));
		this.listen(update => {
			switch (update.type) {
				case ListEventKind.Append:
					return target.append(modifier(update.member));
				case ListEventKind.Prepend:
					return target.prepend(modifier(update.member));
				case ListEventKind.Insert:
					return target.insertAt(update.member.index.value, modifier(update.member));
				case ListEventKind.Remove:
					return target.removeAt(update.member.index.value);
				case ListEventKind.Remove:
					return target.removeAt(update.member.index.value);
				case ListEventKind.Replace:
					return target.replaceAt(update.member.index.value, modifier(update.member));
				case ListEventKind.Swap:
					return target.swapBetween(update.a.index.value, update.b.index.value);
				case ListEventKind.Update:
					return target.set(update.list.toArray().map(modifier));
				default:
					unreachable(update);
			}
		});
		return target.readonly();
	}

	// // TODO: implement sort
	// sort(compareFn: (a: T, b: T) => number): List<T> {
	// 	const sorted = new List<T>();
	// }

	// TODO: this implementation is flawed. If source list is modified so previously
	// unfiltered members become eligible, they will not be added to the filtered list.
	// filter(filterFn: (value: T, index: number) => boolean): List<T> {
	// 	const filtered = new List<T>();

	// 	for (const member of this) {
	// 		if (filterFn(member.value, member.index.value)) {
	// 			const appended = filtered.append(member.value);
	// 			member.listen(update => {
	// 				if (filterFn(update, member.index.value)) appended.set(update);
	// 				else appended.remove();
	// 			});
	// 		}
	// 	}

	// 	// TODO: we should somehow translate the events from the original list to the filtered list
	// 	// This involves mapping the index of the event to the index of the filtered list
	// 	this.listen(update => filtered.update(update.list.toPlainArray().filter(filterFn)));
	// 	return filtered;
	// }
}

export class ReadonlyList<T> {
	/** @internal */
	source: List<T>;
	size: ReadonlyState<number>;
	listen: (listener: (event: ListEvent) => void) => () => void;
	at: (index: number) => ReadonlyMember<T> | undefined;
	reverse: () => ReadonlyList<T>;
	slice: (start: number, end: number) => ReadonlyList<T>;
	toPlainArray: () => T[];

	constructor(source: List<T>) {
		this.source = source;
		this.size = source.size.readonly();
		this.listen = listener => source.listen(listener);
		this.at = index => source.at(index)?.readonly();
		this.reverse = () => source.reverse();
		this.slice = (start, end) => source.slice(start, end);
		this.toPlainArray = () => source.toArray();
	}

	*[Symbol.iterator]() {
		for (const member of this.source) yield member.readonly();
	}

	each<U>(modifier: (value: ReadonlyMember<T>) => U): ReadonlyList<U> {
		const target = new List<U>();
		for (const member of this) target.append(modifier(member));
		this.source.listen(update => {
			switch (update.type) {
				case ListEventKind.Append:
					return target.append(modifier(update.member.readonly()));
				case ListEventKind.Prepend:
					return target.prepend(modifier(update.member.readonly()));
				case ListEventKind.Insert:
					return target.insertAt(update.member.index.value, modifier(update.member.readonly()));
				case ListEventKind.Remove:
					return target.removeAt(update.member.index.value);
				case ListEventKind.Remove:
					return target.removeAt(update.member.index.value);
				case ListEventKind.Replace:
					return target.replaceAt(update.member.index.value, modifier(update.member.readonly()));
				case ListEventKind.Swap:
					return target.swapBetween(update.a.index.value, update.b.index.value);
				case ListEventKind.Update:
					return target.set(update.list.toArray().map(modifier));
				default:
					unreachable(update);
			}
		});
		return target.readonly();
	}

	readonly(): ReadonlyList<T> {
		return this;
	}
}
