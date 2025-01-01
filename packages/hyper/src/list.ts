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

export enum ListEventKind {
	Append = "append",
	Prepend = "prepend",
	Insert = "insert",
	Remove = "remove",
	Replace = "replace",
	Swap = "swap",
	Move = "move",
	Update = "update",
}

type ListEvent =
	| { type: ListEventKind.Append; member: Member<any>; list: List<any> }
	| { type: ListEventKind.Prepend; member: Member<any>; list: List<any> }
	| { type: ListEventKind.Insert; member: Member<any>; list: List<any> }
	| { type: ListEventKind.Remove; member: Member<any>; list: List<any> }
	| { type: ListEventKind.Replace; member: Member<any>; old: Member<any>; list: List<any> }
	| { type: ListEventKind.Swap; a: Member<any>; b: Member<any>; list: List<any> }
	| { type: ListEventKind.Move; member: Member<any>; index: number; list: List<any> }
	| { type: ListEventKind.Update; list: List<any> };

const internal = {
	assertIndexLow(index: number) {
		if (index < 0) throw new RangeError("Index must be non-negative");
	},

	assertIndexHigh(index: number, list: List<any>) {
		if (index >= list.size.value) throw new RangeError("Index is out of bounds");
	},

	assertIndexInBounds(index: number, list: List<any>) {
		this.assertIndexLow(index);
		this.assertIndexHigh(index, list);
	},

	removeMember<T>(list: List<T>, member: Member<T>): number {
		if (member.prev) member.prev.next = member.next;
		if (member.next) member.next.prev = member.prev;

		if (list.first === member) list.first = member.next;
		if (list.last === member) list.last = member.prev;

		// update the indices of the remaining members
		list.updateIndices();
		return list.size.value;
	},

	replaceMember<T>(list: List<T>, old: Member<T>, value: T): Member<T> {
		console.log("--------------------------------");
		console.log("member index:", old.index.value, "; value:", value);
		console.log("Before   :", list.toArray());
		const newMember = new Member({
			parent: list,
			index: old.index.value,
			value,
			next: old.next,
			prev: old.prev,
		});

		if (old.prev) old.prev.next = newMember;
		if (old.next) old.next.prev = newMember;

		if (list.first === old) list.first = newMember;
		if (list.last === old) list.last = newMember;

		console.log("After    :", list.toArray());

		return newMember;
	},

	appendMember<T>(list: List<T>, member: Member<T>): Member<T> {
		if (list.last) list.last.next = member;
		// list is going to be the only member in the list
		if (!list.first) list.first = member;
		list.last = member;

		list.size.set(list.size.value + 1);
		return member;
	},

	append<T>(list: List<T>, value: T): Member<T> {
		const member = new Member({
			parent: list,
			index: list.size.value,
			value: value,
			next: null,
			prev: list.last,
		});
		return internal.appendMember(list, member);
	},

	prepend<T>(list: List<T>, value: T): Member<T> {
		const member = new Member({
			parent: list,
			index: 0,
			value: value,
			next: list.first,
			prev: null,
		});

		if (list.first) list.first.prev = member;
		// this is going to be the only member in the list
		if (!list.last) list.last = member;
		list.first = member;

		// since top of the list was changed, we need to update all indices
		list.updateIndices();
		return member;
	},

	pop<T>(list: List<T>): Member<T> | undefined {
		const last = list.last;
		if (last) {
			if (last.prev) last.prev.next = null;
			list.last = last.prev;
			if (list.first === last) list.first = list.last;
			list.size.set(list.size.value - 1);
			return last;
		}
	},

	shift<T>(list: List<T>): Member<T> | undefined {
		const first = list.first;
		if (first) {
			if (first.next) first.next.prev = null;
			list.first = first.next;
			if (list.last === first) list.last = list.first;
			list.updateIndices();
			return first;
		}
	},

	insertMemberBefore<T>(list: List<T>, member: Member<T>, newMember: Member<T>): Member<T> {
		if (member.prev) member.prev.next = newMember;
		newMember.prev = member.prev;
		newMember.next = member;
		member.prev = newMember;

		if (list.first === member) list.first = newMember;

		list.updateIndices();
		return newMember;
	},

	insertMemberAt<T>(list: List<T>, index: number, newMember: Member<T>): Member<T> {
		internal.assertIndexLow(index);
		// TODO: handle the case where the index is out of bounds
		// Consider whether sparse lists should be supported
		if (index > list.size.value) throw new RangeError("Index is out of bounds");

		// Special case: inserting at the end of the list
		if (index === list.size.value) return internal.appendMember(list, newMember);

		const member = list.at(index);
		if (!member) throw new RangeError(`Could not find member at index ${index}. This is a bug.`);

		return internal.insertMemberBefore(list, member, newMember);
	},

	insertAt<T>(list: List<T>, index: number, value: T): Member<T> {
		const newMember = new Member({ parent: list, index, value, next: null, prev: null });
		return internal.insertMemberAt(list, index, newMember);
	},

	removeAt<T>(list: List<T>, index: number): Member<T> {
		internal.assertIndexInBounds(index, list);

		const member = list.at(index);
		if (!member) throw new RangeError(`Could not find member at index ${index}. This is a bug.`);

		internal.removeMember(list, member);
		return member;
	},

	replaceAt<T>(list: List<T>, index: number, value: T): [Member<T>, Member<T>] {
		internal.assertIndexInBounds(index, list);

		const member = list.at(index);
		if (!member) throw new RangeError(`Could not find member at index ${index}. This is a bug.`);

		const newMember = internal.replaceMember(list, member, value);
		return [member, newMember];
	},

	swap<T>(list: List<T>, a: Member<T>, b: Member<T>): void {
		if (a === b) return;

		// Store original references
		const aNext = a.next;
		const aPrev = a.prev;
		const bNext = b.next;
		const bPrev = b.prev;

		// Handle adjacent nodes
		if (aNext === b) {
			// A -> B are adjacent
			a.next = bNext;
			a.prev = b;
			b.next = a;
			b.prev = aPrev;
			if (bNext) bNext.prev = a;
			if (aPrev) aPrev.next = b;
		} else if (bNext === a) {
			// B -> A are adjacent
			b.next = aNext;
			b.prev = a;
			a.next = b;
			a.prev = bPrev;
			if (aNext) aNext.prev = b;
			if (bPrev) bPrev.next = a;
		} else {
			// Non-adjacent nodes
			a.next = bNext;
			a.prev = bPrev;
			b.next = aNext;
			b.prev = aPrev;

			// Update surrounding nodes
			if (aPrev) aPrev.next = b;
			if (aNext) aNext.prev = b;
			if (bPrev) bPrev.next = a;
			if (bNext) bNext.prev = a;
		}

		// Update first/last pointers
		if (list.first === a) list.first = b;
		else if (list.first === b) list.first = a;
		if (list.last === a) list.last = b;
		else if (list.last === b) list.last = a;

		// Swap indices
		const aIndex = a.index.value;
		const bIndex = b.index.value;
		a.index.set(bIndex);
		b.index.set(aIndex);
	},
};

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
		const size = internal.removeMember(this, member);
		member.parent.notify({ type: ListEventKind.Remove, member, list: member.parent });
		return size;
	}

	replaceMember(member: Member<T>, value: T) {
		const newMember = internal.replaceMember(this, member, value);
		this.notify({ type: ListEventKind.Replace, member: newMember, old: member, list: this });
	}

	append(value: T): Member<T> {
		const member = internal.append(this, value);
		this.notify({ type: ListEventKind.Append, member, list: this });
		return member;
	}

	prepend(value: T): Member<T> {
		const member = internal.prepend(this, value);
		this.notify({ type: ListEventKind.Prepend, member, list: this });
		return member;
	}

	pop(): Member<T> | undefined {
		const last = internal.pop(this);
		if (last) this.notify({ type: ListEventKind.Remove, member: last, list: this });
		return last;
	}

	shift(): Member<T> | undefined {
		const first = internal.shift(this);
		if (first) this.notify({ type: ListEventKind.Remove, member: first, list: this });
		return first;
	}

	/** @escapes This function escapes the list and returns a plain array. The result is not reactive. */
	toArray(): T[] {
		const array: T[] = [];
		for (const member of this) array.push(member.value);
		return array;
	}

	find(value: T): Member<T> | undefined {
		let current = this.first;
		while (current) {
			if (current.value === value) return current;
			current = current.next;
		}
	}

	at(index: number): Member<T> | undefined {
		if (index < 0) index = this.size.value + index + 1;

		let currentIndex = 0;
		let current: Member<T> | null = this.first;

		while (current) {
			if (currentIndex === index) return current;
			current = current.next;
			currentIndex++;
		}

		return undefined;
	}

	insertAt(index: number, value: T): T {
		const newMember = internal.insertAt(this, index, value);
		this.notify({ type: ListEventKind.Insert, member: newMember, list: this });
		return newMember.value;
	}

	removeAt(index: number): Member<T> {
		const member = internal.removeAt(this, index);
		this.notify({ type: ListEventKind.Remove, member, list: this });
		return member;
	}

	replaceAt(index: number, value: T): Member<T> {
		const [old, member] = internal.replaceAt(this, index, value);
		this.notify({ type: ListEventKind.Replace, member, old, list: this });
		return member;
	}

	swap(a: Member<T>, b: Member<T>) {
		internal.swap(this, a, b);
		this.notify({ type: ListEventKind.Swap, a, b, list: this });
	}

	swapBetween(i: number, j: number) {
		internal.assertIndexInBounds(i, this);
		internal.assertIndexInBounds(j, this);

		const a = this.at(i);
		const b = this.at(j);
		if (a && b) this.swap(a, b);
	}

	moveBefore(member: Member<T>, before: Member<T>) {
		if (member.index.value === before.index.value) return;
		internal.removeMember(this, member);
		internal.insertMemberBefore(this, before, member);
		this.notify({ type: ListEventKind.Move, member, index: before.index.value, list: this });
	}

	moveTo(index: number, member: Member<T>) {
		internal.assertIndexInBounds(index, this);

		// Special case: moving to the end of the list
		if (index === this.size.value - 1) {
			internal.removeMember(this, member);
			internal.append(this, member.value);
			this.notify({ type: ListEventKind.Move, member, index, list: this });
		} else {
			const before = this.at(index);
			if (before) return this.moveBefore(member, before);
		}
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
		if (start < 0) start = this.size.value + start;
		if (end < 0) end = this.size.value + end;
		let member = this.first;
		while (member) {
			if (member.index.value >= start && member.index.value < end) {
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
					return reversed.insertAt(this.size.value - update.member.index.value - 1, update.member.value);
				case ListEventKind.Remove:
					return reversed.removeAt(reversed.size.value - update.member.index.value - 1);
				case ListEventKind.Replace:
					return reversed.replaceAt(reversed.size.value - update.member.index.value - 1, update.member.value);
				case ListEventKind.Swap:
					return reversed.swapBetween(
						reversed.size.value - update.a.index.value - 1,
						reversed.size.value - update.b.index.value - 1,
					);
				case ListEventKind.Move:
					return reversed.moveTo(reversed.size.value - update.index - 1, update.member);
				case ListEventKind.Update:
					reversed.set([]); // Clear the list first
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
				case ListEventKind.Move:
					return target.moveTo(update.index, update.member);
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
	toArray: () => T[];

	constructor(source: List<T>) {
		this.source = source;
		this.size = source.size.readonly();
		this.listen = listener => source.listen(listener);
		this.at = index => source.at(index)?.readonly();
		this.reverse = () => source.reverse();
		this.slice = (start, end) => source.slice(start, end);
		this.toArray = () => source.toArray();
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
				case ListEventKind.Move:
					return target.moveTo(update.index, update.member);
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
