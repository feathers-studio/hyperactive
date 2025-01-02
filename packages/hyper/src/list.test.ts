import { describe, it, expect, jest } from "bun:test";
import { List, ListEventKind } from "./list";

describe("List", () => {
	it("should be able to be created from a plain array", () => {
		const list = new List([1, 2, 3]);
		expect(list.size.value).toBe(3);
		expect(list.first?.value).toBe(1);
		expect(list.last?.value).toBe(3);
		expect(list.toArray()).toEqual([1, 2, 3]);
	});

	it("should be iterable", () => {
		const list = new List([1, 2, 3]);
		const iterator = list[Symbol.iterator]();
		expect(iterator.next().value.value).toBe(1);
		expect(iterator.next().value.value).toBe(2);
		expect(iterator.next().value.value).toBe(3);
		expect(iterator.next().done).toBe(true);
	});

	it("should be updatable", () => {
		const list = new List([1, 2, 3]);

		const listener = jest.fn();
		list.listen(listener);

		list.set([]);
		expect(list.size.value).toBe(0);
		expect(list.first).toBeUndefined();
		expect(list.last).toBeUndefined();
		expect(list.toArray()).toEqual([]);
		expect(listener).toHaveBeenCalledTimes(1);

		list.set([4, 5, 6]);
		expect(list.first?.value).toBe(4);
		expect(list.last?.value).toBe(6);
		expect(list.size.value).toBe(3);
		expect(list.toArray()).toEqual([4, 5, 6]);

		expect(listener).toHaveBeenCalledTimes(2);
	});

	it("should have members that are updatable", () => {
		const list = new List([1, 2, 3]);
		const member = list.at(0);

		expect(member?.value).toBe(1);

		const listener = jest.fn();
		member?.listen(listener);
		member?.set(4);

		expect(member?.value).toBe(4);
		expect(list.toArray()).toEqual([4, 2, 3]);
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("should check references", () => {
		const list = new List([1, 2, 3]);
		expect(List.isList(list)).toBe(true);
		expect(List.isReadonly(list)).toBe(false);
		expect(List.isList(list.readonly())).toBe(true);
		expect(List.isReadonly(list.readonly())).toBe(true);
	});

	it("should be made readonly", () => {
		const list = new List([1, 2, 3]);
		const readonly = list.readonly();

		const listener = jest.fn();
		const unsubscribe = readonly.listen(listener);

		list.append(4);
		expect(readonly.size.value).toBe(4);

		list.dropLast();
		expect(readonly.size.value).toBe(3);

		unsubscribe();

		expect(listener).toHaveBeenCalledTimes(2);

		const first = list.at(0);
		const ro_first = readonly.at(0);
		const listener2 = jest.fn();
		ro_first?.listen(listener2);
		first?.set(4);

		expect(listener2).toHaveBeenCalledTimes(1);
	});

	it("should be removable by member", () => {
		const list = new List([1, 2, 3]);
		const second = list.at(1);
		list.removeMember(second!);
		expect(list.size.value).toBe(2);
		expect(list.at(1)?.value).toBe(3);
		expect(list.toArray()).toEqual([1, 3]);
	});

	it("should be replaceable", () => {
		const list = new List([1, 2, 3]);
		const second = list.at(1);
		list.replaceMember(second!, 4);
		expect(list.size.value).toBe(3);
		expect(list.at(1)?.value).toBe(4);
		expect(list.toArray()).toEqual([1, 4, 3]);
	});

	it("should be appendable", () => {
		const list = new List([1, 2, 3]);
		list.append(4);
		expect(list.size.value).toBe(4);
		expect(list.at(3)?.value).toBe(4);
		expect(list.toArray()).toEqual([1, 2, 3, 4]);
	});

	it("should be appendable (empty list)", () => {
		const list = new List<number>([]);
		list.append(0);
		expect(list.size.value).toBe(1);
		expect(list.at(0)?.value).toBe(0);
		expect(list.toArray()).toEqual([0]);
	});

	it("should be prependable", () => {
		const list = new List([1, 2, 3]);
		list.prepend(0);
		expect(list.size.value).toBe(4);
		expect(list.at(0)?.value).toBe(0);
		expect(list.toArray()).toEqual([0, 1, 2, 3]);
	});

	it("should be prependable (empty list)", () => {
		const list = new List<number>([]);
		list.prepend(0);
		expect(list.size.value).toBe(1);
		expect(list.at(0)?.value).toBe(0);
		expect(list.toArray()).toEqual([0]);
	});

	it("should be poppable", () => {
		const list = new List([1, 2, 3]);
		list.dropLast();
		expect(list.size.value).toBe(2);
		expect(list.at(1)?.value).toBe(2);
		expect(list.toArray()).toEqual([1, 2]);

		list.dropLast();
		expect(list.size.value).toBe(1);
		expect(list.at(0)?.value).toBe(1);
		expect(list.toArray()).toEqual([1]);

		list.dropLast();
		expect(list.size.value).toBe(0);
		expect(list.toArray()).toEqual([]);

		list.append(1);
		expect(list.size.value).toBe(1);
		expect(list.at(0)?.value).toBe(1);
		expect(list.toArray()).toEqual([1]);

		list.prepend(0);
		expect(list.size.value).toBe(2);
		expect(list.at(0)?.value).toBe(0);
		expect(list.toArray()).toEqual([0, 1]);
	});

	it("should be shiftable", () => {
		const list = new List([1, 2, 3]);
		list.dropFirst();
		expect(list.size.value).toBe(2);
		expect(list.at(0)?.value).toBe(2);
		expect(list.toArray()).toEqual([2, 3]);

		list.dropFirst();
		expect(list.size.value).toBe(1);
		expect(list.at(0)?.value).toBe(3);
		expect(list.toArray()).toEqual([3]);

		list.dropFirst();
		expect(list.size.value).toBe(0);
		expect(list.toArray()).toEqual([]);

		list.append(1);
		expect(list.size.value).toBe(1);
		expect(list.at(0)?.value).toBe(1);
		expect(list.toArray()).toEqual([1]);
	});

	it("should be insertable by index", () => {
		const list = new List([1, 2, 3]);
		list.insertAt(1, 4);
		expect(list.size.value).toBe(4);
		expect(list.at(1)?.value).toBe(4);
		expect(list.toArray()).toEqual([1, 4, 2, 3]);

		list.insertAt(0, 0);
		expect(list.size.value).toBe(5);
		expect(list.at(0)?.value).toBe(0);
		expect(list.toArray()).toEqual([0, 1, 4, 2, 3]);
	});

	it("should be removable by index", () => {
		const list = new List([1, 2, 3]);
		list.removeAt(1);
		expect(list.size.value).toBe(2);
		expect(list.at(1)?.value).toBe(3);
		expect(list.toArray()).toEqual([1, 3]);

		list.removeAt(0);
		expect(list.size.value).toBe(1);
		expect(list.at(0)?.value).toBe(3);
		expect(list.toArray()).toEqual([3]);
		expect(list.first?.value).toBe(3);
		expect(list.last?.value).toBe(3);
	});

	it("should be replaceable by index", () => {
		const list = new List([1, 2, 3]);
		list.replaceAt(1, 4);
		expect(list.size.value).toBe(3);
		expect(list.at(1)?.value).toBe(4);
		expect(list.toArray()).toEqual([1, 4, 3]);

		list.replaceAt(0, 0);
		expect(list.size.value).toBe(3);
		expect(list.at(0)?.value).toBe(0);
		expect(list.first?.value).toBe(0);
		expect(list.last?.value).toBe(3);
		expect(list.toArray()).toEqual([0, 4, 3]);

		list.replaceAt(2, 5);
		expect(list.size.value).toBe(3);
		expect(list.at(2)?.value).toBe(5);
		expect(list.first?.value).toBe(0);
		expect(list.last?.value).toBe(5);
		expect(list.toArray()).toEqual([0, 4, 5]);
	});

	it("should be swappable", () => {
		const list = new List([1, 2, 3, 4]);

		{
			const a = list.at(1);
			const b = list.at(2);
			list.swap(a!, b!);

			expect(list.size.value).toBe(4);
			expect(list.at(1)?.value).toBe(3);
			expect(list.at(2)?.value).toBe(2);
			expect(list.toArray()).toEqual([1, 3, 2, 4]);

			// swap back
			list.swap(a!, b!);

			expect(list.size.value).toBe(4);
			expect(list.at(1)?.value).toBe(2);
			expect(list.at(2)?.value).toBe(3);
			expect(list.toArray()).toEqual([1, 2, 3, 4]);
		}

		{
			const first = list.at(0);
			const second = list.at(1);
			list.swap(first!, second!);
			expect(list.size.value).toBe(4);
			expect(list.at(0)?.value).toBe(2);
			expect(list.at(1)?.value).toBe(1);
			expect(list.toArray()).toEqual([2, 1, 3, 4]);

			// swap back
			list.swap(first!, second!);

			expect(list.size.value).toBe(4);
			expect(list.at(0)?.value).toBe(1);
			expect(list.at(1)?.value).toBe(2);
			expect(list.toArray()).toEqual([1, 2, 3, 4]);
		}

		{
			const last = list.at(3);
			const first = list.at(0);
			list.swap(last!, first!);

			expect(list.size.value).toBe(4);
			expect(list.at(0)?.value).toBe(4);
			expect(list.at(3)?.value).toBe(1);
			expect(list.toArray()).toEqual([4, 2, 3, 1]);
		}
	});

	it("should swap between indices", () => {
		const list = new List([1, 2, 3, 4]);
		list.swapBetween(0, 3);
		expect(list.toArray()).toEqual([4, 2, 3, 1]);

		list.swapBetween(0, 3);
		expect(list.toArray()).toEqual([1, 2, 3, 4]);

		list.swapBetween(1, 2);
		expect(list.toArray()).toEqual([1, 3, 2, 4]);

		list.swapBetween(1, 2);
		expect(list.toArray()).toEqual([1, 2, 3, 4]);

		list.swapBetween(0, 2);
		expect(list.toArray()).toEqual([3, 2, 1, 4]);

		list.swapBetween(1, 3);
		expect(list.toArray()).toEqual([3, 4, 1, 2]);
	});

	it("member to index", () => {
		const list = new List([1, 2, 3, 4]);
		list.moveTo(0, list.at(3)!);
		expect(list.toArray()).toEqual([4, 1, 2, 3]);

		list.moveTo(0, list.at(1)!);
		expect(list.toArray()).toEqual([1, 4, 2, 3]);

		list.moveTo(3, list.at(0)!);
		expect(list.toArray()).toEqual([4, 2, 3, 1]);
	});

	it("should notify listeners", () => {
		const list = new List([1, 2, 3]);
		const listener = jest.fn();
		list.listen(listener);
		const ev = { type: ListEventKind.Move, member: list.at(0)!, list, from: 0, to: 1 } as const;
		list.notify(ev);
		expect(listener).toHaveBeenCalledWith(ev);
	});

	it("should slice full list", () => {
		const list = new List([1, 2, 3, 4, 5]);
		const slice = list.slice();
		expect(slice.toArray()).toEqual([1, 2, 3, 4, 5]);
	});

	it("should slice list from index", () => {
		const list = new List([1, 2, 3, 4, 5]);
		const slice = list.slice(1);
		expect(slice.toArray()).toEqual([2, 3, 4, 5]);
	});

	it("should slice partial list", () => {
		const list = new List([1, 2, 3, 4, 5]);
		const slice = list.slice(1, 3);
		expect(slice.toArray()).toEqual([2, 3]);
	});

	it("should slice from negative index", () => {
		const list = new List([1, 2, 3, 4, 5]);
		const slice = list.slice(-2);
		expect(slice.toArray()).toEqual([4, 5]);
	});

	it("should slice from negative index with end", () => {
		const list = new List([1, 2, 3, 4, 5]);
		const slice = list.slice(-2, -1);
		expect(slice.toArray()).toEqual([4]);
	});

	it("should slice from negative index with positive end", () => {
		const list = new List([1, 2, 3, 4, 5]);
		const slice = list.slice(-2, 4);
		expect(slice.toArray()).toEqual([4]);
	});

	it("should slice from positive index with negative end", () => {
		const list = new List([1, 2, 3, 4, 5]);
		const slice = list.slice(1, -1);
		expect(slice.toArray()).toEqual([2, 3, 4]);
	});

	it("should reverse", () => {
		const list = new List([1, 2, 3, 4, 5]);
		const reversed = list.reverse();
		expect(reversed.toArray()).toEqual([5, 4, 3, 2, 1]);
	});

	it("should keep track of changes to original list after reverse", () => {
		const list = new List([1, 2, 3, 4, 5]);
		const reversed = list.reverse();

		// Test initial state
		expect(list.toArray()).toEqual([1, 2, 3, 4, 5]);
		expect(reversed.toArray()).toEqual([5, 4, 3, 2, 1]);

		// Test append
		list.append(6);
		expect(list.toArray()).toEqual([1, 2, 3, 4, 5, 6]);
		expect(reversed.toArray()).toEqual([6, 5, 4, 3, 2, 1]);

		// Test removeAt (beginning, middle, end)
		list.removeAt(0);
		expect(list.toArray()).toEqual([2, 3, 4, 5, 6]);
		expect(reversed.toArray()).toEqual([6, 5, 4, 3, 2]);

		list.removeAt(2);
		expect(list.toArray()).toEqual([2, 3, 5, 6]);
		expect(reversed.toArray()).toEqual([6, 5, 3, 2]);

		list.removeAt(list.size.value - 1);
		expect(list.toArray()).toEqual([2, 3, 5]);
		expect(reversed.toArray()).toEqual([5, 3, 2]);

		// Test prepend
		list.prepend(1);
		expect(list.toArray()).toEqual([1, 2, 3, 5]);
		expect(reversed.toArray()).toEqual([5, 3, 2, 1]);

		// Test insertAt (beginning, middle, end)
		list.insertAt(0, 0);
		expect(list.toArray()).toEqual([0, 1, 2, 3, 5]);
		expect(reversed.toArray()).toEqual([5, 3, 2, 1, 0]);

		list.insertAt(2, 1.5);
		expect(list.toArray()).toEqual([0, 1, 1.5, 2, 3, 5]);
		expect(reversed.toArray()).toEqual([5, 3, 2, 1.5, 1, 0]);

		list.insertAt(list.size.value, 6);
		expect(list.toArray()).toEqual([0, 1, 1.5, 2, 3, 5, 6]);
		expect(reversed.toArray()).toEqual([6, 5, 3, 2, 1.5, 1, 0]);

		// Test replaceAt (beginning, middle, end)
		list.replaceAt(0, 10);
		expect(list.toArray()).toEqual([10, 1, 1.5, 2, 3, 5, 6]);
		expect(reversed.toArray()).toEqual([6, 5, 3, 2, 1.5, 1, 10]);

		list.replaceAt(3, 20);
		expect(list.toArray()).toEqual([10, 1, 1.5, 20, 3, 5, 6]);
		expect(reversed.toArray()).toEqual([6, 5, 3, 20, 1.5, 1, 10]);

		list.replaceAt(list.size.value - 1, 30);
		expect(list.toArray()).toEqual([10, 1, 1.5, 20, 3, 5, 30]);
		expect(reversed.toArray()).toEqual([30, 5, 3, 20, 1.5, 1, 10]);

		// Test pop and shift
		list.dropLast();
		expect(list.toArray()).toEqual([10, 1, 1.5, 20, 3, 5]);
		expect(reversed.toArray()).toEqual([5, 3, 20, 1.5, 1, 10]);

		list.dropFirst();
		expect(list.toArray()).toEqual([1, 1.5, 20, 3, 5]);
		expect(reversed.toArray()).toEqual([5, 3, 20, 1.5, 1]);

		// Test swapping
		list.swapBetween(0, 2);
		expect(list.toArray()).toEqual([20, 1.5, 1, 3, 5]);
		expect(reversed.toArray()).toEqual([5, 3, 1, 1.5, 20]);

		// Test moving
		list.moveTo(0, list.at(3)!);
		expect(list.toArray()).toEqual([3, 20, 1.5, 1, 5]);
		expect(reversed.toArray()).toEqual([5, 1, 1.5, 20, 3]);

		// Test with empty list
		const emptyList = new List<number>([]);
		const reversedEmpty = emptyList.reverse();
		expect(emptyList.toArray()).toEqual([]);
		expect(reversedEmpty.toArray()).toEqual([]);

		emptyList.append(1);
		expect(emptyList.toArray()).toEqual([1]);
		expect(reversedEmpty.toArray()).toEqual([1]);
	});

	it("should be transformable", () => {
		const list = new List([1, 2, 3]);
		const transformed = list.each(value => value.value + 1);
		expect(transformed.size.value).toBe(3);
		expect(transformed.at(0)?.value).toBe(2);
		expect(transformed.at(1)?.value).toBe(3);
		expect(transformed.at(2)?.value).toBe(4);
	});

	it("should keep track of changes to original list after transform", () => {
		const list = new List([1, 2, 3]);
		const transformed = list.each(value => value.value + 1);

		list.append(4);
		expect(transformed.size.value).toBe(4);
		expect(transformed.at(3)?.value).toBe(5);

		list.removeAt(0);
		expect(list.toArray()).toEqual([2, 3, 4]);
		expect(transformed.toArray()).toEqual([3, 4, 5]);

		list.removeAt(1);
		expect(list.toArray()).toEqual([2, 4]);
		expect(transformed.toArray()).toEqual([3, 5]);

		list.removeAt(1);
		expect(list.toArray()).toEqual([2]);
		expect(transformed.toArray()).toEqual([3]);

		list.prepend(1);
		expect(list.toArray()).toEqual([1, 2]);
		expect(transformed.toArray()).toEqual([2, 3]);

		list.insertAt(0, 0);
		expect(list.toArray()).toEqual([0, 1, 2]);
		expect(transformed.toArray()).toEqual([1, 2, 3]);

		list.replaceAt(1, 1.5);
		expect(list.toArray()).toEqual([0, 1.5, 2]);
		expect(transformed.toArray()).toEqual([1, 2.5, 3]);

		list.replaceAt(2, 2.5);
		expect(list.toArray()).toEqual([0, 1.5, 2.5]);
		expect(transformed.toArray()).toEqual([1, 2.5, 3.5]);

		list.dropLast();
		expect(list.toArray()).toEqual([0, 1.5]);
		expect(transformed.toArray()).toEqual([1, 2.5]);

		list.dropFirst();
		expect(list.toArray()).toEqual([1.5]);
		expect(transformed.toArray()).toEqual([2.5]);

		list.replaceAt(0, 2.5);
		expect(list.toArray()).toEqual([2.5]);
		expect(transformed.toArray()).toEqual([3.5]);

		list.append(10);
		expect(list.toArray()).toEqual([2.5, 10]);
		expect(transformed.toArray()).toEqual([3.5, 11]);

		list.swapBetween(0, 1);
		expect(list.toArray()).toEqual([10, 2.5]);
		expect(transformed.toArray()).toEqual([11, 3.5]);

		list.moveTo(0, list.at(1)!);
		expect(list.toArray()).toEqual([2.5, 10]);
		expect(transformed.toArray()).toEqual([3.5, 11]);

		list.moveTo(1, list.at(0)!);
		expect(list.toArray()).toEqual([10, 2.5]);
		expect(transformed.toArray()).toEqual([11, 3.5]);

		list.at(1)?.set(1.5);
		expect(list.toArray()).toEqual([10, 1.5]);
		expect(transformed.toArray()).toEqual([11, 2.5]);

		list.moveTo(0, list.at(1)!);
		expect(list.toArray()).toEqual([1.5, 10]);
		expect(transformed.toArray()).toEqual([2.5, 11]);
	});
});
