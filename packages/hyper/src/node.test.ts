import { test, expect } from "bun:test";

import { h, normaliseParams } from "./node.ts";
import { State } from "./state.ts";
import { List } from "./list.ts";
import { p } from "./elements.ts";

const testNode = h("p", "test");
const testState = new State("5");
const testReadonlyState = testState.to(v => String(v + 5));
const testListState = new List([5, 10]).each(v => h("p", String(v)));
const element = p(testState, "/", testState);

test("normaliseParams: string", () => {
	expect(normaliseParams("test")).toEqual({ attrs: {}, children: ["test"] });
});

test("normaliseParams: node", () => {
	expect(normaliseParams(testNode)).toEqual({ attrs: {}, children: [testNode] });
});

test("normaliseParams: attributes only", () => {
	expect(normaliseParams({ id: "test" })).toEqual({ attrs: { id: "test" }, children: [] });
});

test("normaliseParams: attributes and string child", () => {
	expect(normaliseParams({ id: "test" }, ["test"])).toEqual({ attrs: { id: "test" }, children: ["test"] });
});

test("normaliseParams: attributes and node child", () => {
	expect(normaliseParams({ id: "test" }, [testNode])).toEqual({
		attrs: { id: "test" },
		children: [testNode],
	});
});

test("normaliseParams: state", () => {
	expect(normaliseParams(testState)).toEqual({ attrs: {}, children: [testState] });
});

test("normaliseParams: readonly state", () => {
	expect(normaliseParams(testReadonlyState)).toEqual({ attrs: {}, children: [testReadonlyState] });
});

test("normaliseParams: list state", () => {
	expect(normaliseParams(testListState)).toEqual({ attrs: {}, children: [testListState] });
});

test("normaliseParams: state with children", () => {
	expect(element).toEqual({
		tag: "p",
		attrs: {},
		children: [testState, "/", testState],
	});
});
