import { describe, it, expect, jest } from "bun:test";
import { List } from "./list";

describe("List", () => {
	it("should be able to be created from a plain array", () => {
		const list = new List([1, 2, 3]);
		expect(list.size.value).toBe(3);
		expect(list.first?.value).toBe(1);
		expect(list.last?.value).toBe(3);
		expect(list.toArray()).toEqual([1, 2, 3]);
	});

	it("should be able to be updatable", () => {
		const list = new List([1, 2, 3]);

		const listener = jest.fn();
		list.listen(listener);

		list.set([]);
		expect(list.size.value).toBe(0);
		expect(list.first).toBeNull();
		expect(list.last).toBeNull();
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

		list.pop();
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
		list.pop();
		expect(list.size.value).toBe(2);
		expect(list.at(1)?.value).toBe(2);
		expect(list.toArray()).toEqual([1, 2]);

		list.pop();
		expect(list.size.value).toBe(1);
		expect(list.at(0)?.value).toBe(1);
		expect(list.toArray()).toEqual([1]);

		list.pop();
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
		list.shift();
		expect(list.size.value).toBe(2);
		expect(list.at(0)?.value).toBe(2);
		expect(list.toArray()).toEqual([2, 3]);

		list.shift();
		expect(list.size.value).toBe(1);
		expect(list.at(0)?.value).toBe(3);
		expect(list.toArray()).toEqual([3]);

		list.shift();
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

	it("should move member to index", () => {
		const list = new List([1, 2, 3, 4]);
		list.moveTo(0, list.at(3)!);
		expect(list.toArray()).toEqual([4, 1, 2, 3]);

		list.moveTo(0, list.at(1)!);
		expect(list.toArray()).toEqual([1, 4, 2, 3]);

		list.moveTo(3, list.at(0)!);
		expect(list.toArray()).toEqual([4, 2, 3, 1]);
	});

	// it("should be transformable", () => {
	// 	const list = new List([1, 2, 3]);
	// 	const transformed = list.each(value => value.value + 1);
	// 	expect(transformed.size.value).toBe(3);
	// 	console.log(transformed.toArray());
	// 	expect(transformed.at(0)?.value).toBe(2);
	// 	expect(transformed.at(1)?.value).toBe(3);
	// 	expect(transformed.at(2)?.value).toBe(4);
	// });
});
