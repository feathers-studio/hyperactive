import { ReadonlyState, State } from "./state.ts";
import { unreachable } from "./util.ts";

export class Member<T> extends State<T> {
	parent: List<T>;
	#readonly: ReadonlyMember<T> | undefined;

	constructor({ parent, value }: { parent: List<T>; value: T }) {
		super(value);
		this.parent = parent;
		this.listen(() => parent.notify({ kind: ListEventKind.MemberUpdate, list: parent, member: this }));
	}

	getCurrentIndex() {
		return this.parent.array.indexOf(this);
	}

	remove() {
		this.parent.removeMember(this);
	}

	replace(value: T) {
		this.parent.replaceMember(this, value);
	}

	readonly(): ReadonlyMember<T> {
		// This avoids creating a new ReadonlyMember if it already exists for this member
		return (this.#readonly ??= new ReadonlyMember(this, this.parent.readonly()));
	}
}

export class ReadonlyMember<T> extends ReadonlyState<T> {
	parent: ReadonlyList<T>;

	constructor(member: Member<T>, parent?: ReadonlyList<T>) {
		super(member.value, member);
		this.parent = parent ?? member.parent.readonly();
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
	MemberUpdate = "member-update",
}

type ListEvent =
	| { kind: ListEventKind.Append; list: List<any>; member: Member<any> }
	| { kind: ListEventKind.Prepend; list: List<any>; member: Member<any> }
	| { kind: ListEventKind.Insert; list: List<any>; member: Member<any>; index: number }
	| { kind: ListEventKind.Remove; list: List<any>; member: Member<any>; index: number }
	| { kind: ListEventKind.Replace; list: List<any>; member: Member<any>; old: Member<any>; index: number }
	| { kind: ListEventKind.Swap; list: List<any>; a: Member<any>; b: Member<any>; from: number; to: number }
	| { kind: ListEventKind.Move; list: List<any>; member: Member<any>; from: number; to: number }
	| { kind: ListEventKind.Update; list: List<any> }
	| { kind: ListEventKind.MemberUpdate; list: List<any>; member: Member<any> };

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
		const index = list.array.indexOf(member);
		list.array.splice(index, 1);
		list.size.set(list.size.value - 1);
		return index;
	},

	replaceMember<T>(list: List<T>, old: Member<T>, value: T): number {
		const index = list.array.indexOf(old);
		list.array[index] = new Member({ parent: list, value });
		return index;
	},

	appendMember<T>(list: List<T>, member: Member<T>): number {
		list.array.push(member);
		list.size.set(list.size.value + 1);
		return list.size.value;
	},

	append<T>(list: List<T>, value: T): Member<T> {
		const member = new Member({ parent: list, value });
		internal.appendMember(list, member);
		return member;
	},

	prependMember<T>(list: List<T>, member: Member<T>): Member<T> {
		list.array.unshift(member);
		list.size.set(list.size.value + 1);
		return member;
	},

	prepend<T>(list: List<T>, value: T): Member<T> {
		const member = new Member({ parent: list, value });
		return internal.prependMember(list, member);
	},

	drop<T>(list: List<T>): Member<T> | undefined {
		const member = list.array.pop();
		if (member) list.size.set(list.size.value - 1);
		return member;
	},

	dropFirst<T>(list: List<T>): Member<T> | undefined {
		const member = list.array.shift();
		if (member) list.size.set(list.size.value - 1);
		return member;
	},

	insertMemberBefore<T>(list: List<T>, member: Member<T>, newMember: Member<T>): number {
		const index = list.array.indexOf(member);
		list.array.splice(index, 0, newMember);
		list.size.set(list.size.value + 1);
		return index;
	},

	insertMemberAt<T>(list: List<T>, index: number, newMember: Member<T>): number {
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
		const newMember = new Member({ parent: list, value });
		internal.insertMemberAt(list, index, newMember);
		return newMember;
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

		const newIndex = internal.replaceMember(list, member, value);
		return [member, list.array[newIndex]!];
	},

	swap<T>(list: List<T>, a: Member<T>, b: Member<T>): [aIndex: number, bIndex: number] {
		const aIndex = list.array.indexOf(a);
		const bIndex = list.array.indexOf(b);
		list.array[aIndex] = b;
		list.array[bIndex] = a;
		return [aIndex, bIndex];
	},
};

export class List<T> {
	/** @internal */
	array: Member<T>[] = [];

	size: State<number> = new State(0);

	/** @internal */
	protected listeners: ((event: ListEvent) => void)[] = [];

	set(iterable: Iterable<T>) {
		this.array = [];

		let index = 0;
		for (const value of iterable) {
			const member: Member<T> = new Member({ parent: this, value });
			this.array.push(member);
			index++;
		}
		this.size.set(index);

		this.notify({ kind: ListEventKind.Update, list: this });
	}

	constructor(init: Iterable<T> = []) {
		// TODO: perhaps this could be lazy?
		this.set(init);
	}

	get first(): Member<T> | undefined {
		return this.array[0];
	}

	get last(): Member<T> | undefined {
		return this.array[this.size.value - 1];
	}

	static isList<T>(value: any): value is List<T> | ReadonlyList<T> {
		return value instanceof List || value instanceof ReadonlyList;
	}

	static isReadonly<T>(value: any): value is ReadonlyList<T> {
		return value instanceof ReadonlyList;
	}

	*[Symbol.iterator](): IterableIterator<Member<T>> {
		for (let i = 0; i < this.size.value; i++) yield this.array[i];
	}

	// /** @internal */
	// updateIndices(): number {
	// 	let index = 0;
	// 	for (const member of this) member.index.set(index++);
	// 	return this.size.set(index);
	// }

	removeMember(member: Member<T>): number {
		const index = internal.removeMember(this, member);
		this.notify({ kind: ListEventKind.Remove, list: this, member, index });
		return index;
	}

	replaceMember(member: Member<T>, value: T): number {
		const index = internal.replaceMember(this, member, value);
		this.notify({ kind: ListEventKind.Replace, list: this, member, old: member, index });
		return index;
	}

	append(value: T): Member<T> {
		const member = internal.append(this, value);
		this.notify({ kind: ListEventKind.Append, member, list: this });
		return member;
	}

	prepend(value: T): Member<T> {
		const member = internal.prepend(this, value);
		this.notify({ kind: ListEventKind.Prepend, member, list: this });
		return member;
	}

	dropLast(): Member<T> | undefined {
		const last = internal.drop(this);
		// TODO: verify that the index is correct. The list will have shrunk by one,
		// so I'm using the size (which will be last index + 1, equal to previous index)
		if (last) this.notify({ kind: ListEventKind.Remove, list: this, member: last, index: this.size.value });
		return last;
	}

	dropFirst(): Member<T> | undefined {
		const first = internal.dropFirst(this);
		if (first) this.notify({ kind: ListEventKind.Remove, list: this, member: first, index: 0 });
		return first;
	}

	/** @escapes This function escapes the list and returns a plain array. The result is not reactive. */
	toArray(): T[] {
		const array: T[] = [];
		for (const member of this) array.push(member.value);
		return array;
	}

	find(value: T): Member<T> | undefined {
		for (const member of this) if (member.value === value) return member;
		return undefined;
	}

	at(index: number): Member<T> | undefined {
		if (index < 0) index = this.size.value + index + 1;
		return this.array[index];
	}

	insertAt(index: number, value: T): Member<T> {
		const newMember = internal.insertAt(this, index, value);
		this.notify({ kind: ListEventKind.Insert, list: this, member: newMember, index });
		return newMember;
	}

	removeAt(index: number): Member<T> {
		const member = internal.removeAt(this, index);
		this.notify({ kind: ListEventKind.Remove, list: this, member, index });
		return member;
	}

	replaceAt(index: number, value: T): Member<T> {
		const [old, member] = internal.replaceAt(this, index, value);
		this.notify({ kind: ListEventKind.Replace, list: this, member, old, index });
		return member;
	}

	swap(a: Member<T>, b: Member<T>) {
		const [from, to] = internal.swap(this, a, b);
		this.notify({ kind: ListEventKind.Swap, list: this, a, b, from, to });
	}

	swapBetween(i: number, j: number) {
		internal.assertIndexInBounds(i, this);
		internal.assertIndexInBounds(j, this);

		const a = this.at(i);
		const b = this.at(j);
		if (a && b) this.swap(a, b);
	}

	moveBefore(before: Member<T>, member: Member<T>) {
		if (member === before) return;
		const from = internal.removeMember(this, member);
		const to = internal.insertMemberBefore(this, before, member);
		this.notify({ kind: ListEventKind.Move, list: this, member, from, to });
	}

	moveTo(index: number, member: Member<T>) {
		internal.assertIndexInBounds(index, this);

		// Special case: moving to the end of the list
		if (index === this.size.value - 1) {
			const from = internal.removeMember(this, member);
			internal.append(this, member.value);
			this.notify({ kind: ListEventKind.Move, list: this, member, from, to: index });
		} else {
			const before = this.at(index);
			if (before) return this.moveBefore(before, member);
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

	join(joiner: string): State<string> {
		let init = "";
		for (const member of this) init += member.value + joiner;
		const state = new State<string>(init);

		this.listen(() => {
			let update = "";
			for (const member of this) update += member.value + joiner;
			state.set(update);
		});

		return state;
	}

	// TODO: consider whether slice should react to source list changes
	/** The sliced list will not react to changes in the original list. */
	slice(start: number = 0, end: number = Infinity): ReadonlyList<T> {
		const sliced = new List<T>();
		for (const member of this.array.slice(start, end)) sliced.append(member.value);
		return sliced.readonly();
	}

	reverse(): ReadonlyList<T> {
		const reversed = new List<T>();
		for (const member of this) reversed.prepend(member.value);

		this.listen(update => {
			switch (update.kind) {
				case ListEventKind.Append:
					return reversed.prepend(update.member.value);
				case ListEventKind.Prepend:
					return reversed.append(update.member.value);
				case ListEventKind.Insert:
					return reversed.insertAt(this.size.value - update.index - 1, update.member.value);
				case ListEventKind.Remove:
					return reversed.removeAt(reversed.size.value - update.index - 1);
				case ListEventKind.Replace:
					return reversed.replaceAt(reversed.size.value - update.index - 1, update.member.value);
				case ListEventKind.Swap:
					return reversed.swapBetween(reversed.size.value - update.from - 1, reversed.size.value - update.to - 1);
				case ListEventKind.Move:
					const member = reversed.at(reversed.size.value - update.from - 1);
					if (!member) return;
					return reversed.moveTo(reversed.size.value - update.to - 1, member);
				case ListEventKind.Update:
					reversed.set([]); // Clear the list first
					for (const member of this) reversed.prepend(member.value);
					return;
				case ListEventKind.MemberUpdate:
					return reversed.at(update.member.getCurrentIndex())?.set(update.member.value);
				default:
					unreachable(update);
			}
		});

		return reversed.readonly();
	}

	/** Like `Array#map`, but function receives List Members instead of values. Returns a new ReadonlyList. */
	each<U>(modifier: (value: Member<T>) => U): ReadonlyList<U> {
		const target = new List<U>();
		for (const member of this) target.append(modifier(member));

		this.listen(update => {
			switch (update.kind) {
				case ListEventKind.Append:
					return target.append(modifier(update.member));
				case ListEventKind.Prepend:
					return target.prepend(modifier(update.member));
				case ListEventKind.Insert:
					return target.insertAt(update.index, modifier(update.member));
				case ListEventKind.Remove:
					return target.removeAt(update.index);
				case ListEventKind.Remove:
					return target.removeAt(update.index);
				case ListEventKind.Replace:
					return target.replaceAt(update.index, modifier(update.member));
				case ListEventKind.Swap:
					return target.swapBetween(update.from, update.to);
				case ListEventKind.Move:
					const member = target.at(update.from);
					if (!member) return;
					member.set(modifier(update.member));
					return target.moveTo(update.to, member);
				case ListEventKind.Update:
					return target.set(update.list.toArray().map(modifier));
				case ListEventKind.MemberUpdate:
					return target.at(update.member.getCurrentIndex())?.set(modifier(update.member));
				default:
					unreachable(update);
			}
		});
		return target.readonly();
	}

	sort(compareFn: (a: T, b: T) => number): List<T> {
		const sorted = new List<T>();
		sorted.set(this.toArray().sort(compareFn));

		// TODO: implement smarter reactivity when source list is sorted
		this.listen(update => sorted.set(update.list.toArray().sort(compareFn)));
		return sorted;
	}

	filter(filterFn: (value: T, index: number) => boolean): List<T> {
		const filtered = new List<T>();

		let index = 0;
		for (const member of this) {
			if (filterFn(member.value, index)) filtered.append(member.value);
			index++;
		}

		// TODO: we should somehow translate the events from the original list to the filtered list
		// This involves mapping the index of the event to the index of the filtered list
		this.listen(update => filtered.set(update.list.toArray().filter(filterFn)));
		return filtered;
	}
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
	join: (joiner: string) => ReadonlyState<string>;

	constructor(source: List<T>) {
		this.source = source;
		this.size = source.size.readonly();
		this.listen = listener => source.listen(listener);
		this.at = index => source.at(index)?.readonly();
		this.reverse = () => source.reverse();
		this.slice = (start, end) => source.slice(start, end);
		this.toArray = () => source.toArray();
		this.join = joiner => source.join(joiner);
	}

	*[Symbol.iterator]() {
		for (const member of this.source) yield member.readonly();
	}

	each<U>(modifier: (value: ReadonlyMember<T>) => U): ReadonlyList<U> {
		const target = new List<U>();
		for (const member of this) target.append(modifier(member));

		this.source.listen(update => {
			switch (update.kind) {
				case ListEventKind.Append:
					return target.append(modifier(update.member.readonly()));
				case ListEventKind.Prepend:
					return target.prepend(modifier(update.member.readonly()));
				case ListEventKind.Insert:
					return target.insertAt(update.index, modifier(update.member.readonly()));
				case ListEventKind.Remove:
					return target.removeAt(update.index);
				case ListEventKind.Remove:
					return target.removeAt(update.index);
				case ListEventKind.Replace:
					return target.replaceAt(update.index, modifier(update.member.readonly()));
				case ListEventKind.Swap:
					return target.swapBetween(update.from, update.to);
				case ListEventKind.Move:
					return target.moveTo(update.to, update.member);
				case ListEventKind.Update:
					return target.set(update.list.toArray().map(modifier));
				case ListEventKind.MemberUpdate:
					return target.at(update.member.getCurrentIndex())?.set(modifier(update.member.readonly()));
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
