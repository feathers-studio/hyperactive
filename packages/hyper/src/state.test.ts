import { describe, it, expect, jest } from "bun:test";
import { setTimeout as sleep } from "timers/promises";
import { State } from "./state";

describe("State", () => {
	it("should be able to be created", () => {
		const state = new State(0);
		expect(state.value).toBe(0);
	});

	it("should be able to be reference-checked", () => {
		const state = new State(0);
		expect(State.isState(state)).toBe(true);
		expect(State.isState(state.readonly())).toBe(true);
		expect(State.isState(1)).toBe(false);
		expect(State.isState({})).toBe(false);
	});

	it("should be able to be updated", () => {
		const state = new State(0);
		state.set(1);
		expect(state.value).toBe(1);
	});

	it("should be able to be updated with a function", () => {
		const state = new State(0);
		state.setWith(value => value + 1);
		state.setWith(value => value + 1);
		expect(state.value).toBe(2);
	});

	it("should be able to be listened to", () => {
		const state = new State(0);
		const listener = jest.fn();
		state.listen(listener);
		state.set(1);
		expect(listener).toHaveBeenCalledWith(1);
	});

	it("should be able to be unlistened to", () => {
		const state = new State(0);
		const listener = jest.fn();
		const unsubscribe = state.listen(listener);
		state.set(1);
		unsubscribe();
		state.set(2);
		expect(listener).toHaveBeenCalledWith(1);
		expect(listener).not.toHaveBeenCalledWith(2);
	});

	it("should be able to be readonly", () => {
		const state = new State(0);
		const readonly = state.readonly();
		expect(readonly.value).toBe(0);
	});

	it("should be able to update a readonly", () => {
		const state = new State(0);
		const readonly = state.readonly();
		state.set(1);
		expect(readonly.value).toBe(1);
	});

	it("should be transformable", () => {
		const state = new State(0);
		const transformed = state.to(value => value + 1);
		state.set(100);
		expect(transformed.value).toBe(101);
	});

	it("should be able to be filtered", () => {
		const state = new State(0);
		const filtered = state.if(value => value % 2 === 0);
		state.set(1);
		expect(filtered.value).toBe(0);
		state.set(2);
		expect(filtered.value).toBe(2);
	});

	it("should call listeners when filtered", () => {
		const state = new State(0);
		const filtered = state.if(value => value % 2 === 0);
		const listener = jest.fn();
		filtered.listen(listener);
		state.set(1);
		expect(listener).not.toHaveBeenCalled();
		state.set(2);
		expect(listener).toHaveBeenCalledWith(2);
	});

	it("should be able to be composed", () => {
		const a = new State(0);
		const b = new State(1);
		const composed = State.compose({ a, b });
		a.set(100);
		b.set(200);
		expect(composed.value).toEqual({ a: 100, b: 200 });
	});

	it("should call listeners when composed", () => {
		const a = new State(0);
		const b = new State(1);
		const composed = State.compose({ a, b });
		const listener = jest.fn();
		composed.listen(listener);
		a.set(100);
		expect(listener).toHaveBeenCalledWith({ a: 100, b: 1 });
	});

	it("should flow into another state", () => {
		const a = new State(0);
		const b = new State(1);
		a.pipe(b);
		a.set(100);
		expect(b.value).toBe(100);
	});

	it("should flow into a composed state", () => {
		const a = new State(0);
		const b = new State(1);
		const c = State.compose({ a, b });
		a.pipe(b);
		a.set(100);
		expect(c.value).toEqual({ a: 100, b: 100 });
	});

	it("should be able to be debounced", async () => {
		const state = new State(0);
		const debounced = state.debounce(100);

		const listener = jest.fn();
		debounced.listen(listener);

		state.set(1);
		expect(state.value).toBe(1);

		state.set(2);
		expect(state.value).toBe(2);

		expect(debounced.value).toBe(0);

		await sleep(10);

		state.set(3);
		expect(state.value).toBe(3);

		expect(debounced.value).toBe(0);

		await sleep(100);
		expect(debounced.value).toBe(3);

		expect(listener).toHaveBeenCalledWith(3);
		expect(listener).toHaveBeenCalledTimes(1);
	});
});
