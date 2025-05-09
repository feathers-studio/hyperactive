import { describe, expect, it } from "bun:test";
import { div, p, span } from "./elements.ts";
import { Context, renderHTML } from "./index.ts";

describe("Context", () => {
	it("should create a simple context", () => {
		const context = new Context<string>(() => "test");

		const nested = context.with(value => p(value));
		const tree = context.provider("value", div(nested));

		expect(renderHTML(tree)).toBe("<div><p>value</p></div>");
	});

	it("should create a nested context", () => {
		const context = new Context<string>(() => "test");

		const nested2 = context.with(value => p(value));
		const nested = context.provider("other value", nested2);
		const tree = context.provider("value", div(nested));

		expect(renderHTML(tree)).toBe("<div><p>other value</p></div>");
	});

	it("should throw an error if a context is not found", () => {
		const context = new Context<string>(() => "test", "ErrorContext");

		const tree = context.with(value => div(p(value)));

		expect(() => renderHTML(tree)).toThrow("Requested context for (id: ErrorContext) not found. Was the Context Provider used?");
	});

	it("should handle multiple distinct contexts correctly", () => {
		const stringContext = new Context<string>(() => "default string");
		const numberContext = new Context<number>(() => 0);

		const tree = stringContext.provider(
			"hello",
			numberContext.provider(
				123,
				stringContext.with(sVal => numberContext.with(nVal => p(`${sVal} ${nVal}`))),
			),
		);

		expect(renderHTML(tree)).toBe("<p>hello 123</p>");
	});

	it("should handle objects as context values", () => {
		type MyObject = { message: string; count: number };
		const objectContext = new Context<MyObject>(() => ({ message: "default", count: 0 }));

		const tree = objectContext.provider(
			{ message: "custom", count: 42 },
			objectContext.with(obj => p(`${obj.message} ${obj.count}`)),
		);

		expect(renderHTML(tree)).toBe("<p>custom 42</p>");
	});

	it("should allow null as a provided context value", () => {
		// Default value is non-null to distinguish it from an explicit null
		const nullableContext = new Context<string | null>(() => "default string");

		const tree = nullableContext.provider(
			null, // Explicitly providing null
			nullableContext.with(value => p(value === null ? "was null" : value!)),
		);

		expect(renderHTML(tree)).toBe("<p>was null</p>");
	});

	it("should allow undefined as a provided context value", () => {
		const undefinedContext = new Context<string | undefined>(() => "default");

		const tree = undefinedContext.provider(
			undefined,
			undefinedContext.with(value => p(value === undefined ? "was undefined" : value!)),
		);
		expect(renderHTML(tree)).toBe("<p>was undefined</p>");
	});

	it("should handle functions as context values", () => {
		const funcContext = new Context<() => string>(() => () => "default func");

		const tree = funcContext.provider(
			() => "dynamic value from func",
			funcContext.with(fn => p(fn())),
		);
		expect(renderHTML(tree)).toBe("<p>dynamic value from func</p>");
	});

	it("multiple sibling consumers should receive the same context value", () => {
		const sharedContext = new Context<string>(() => "default");

		const sibling1 = sharedContext.with(value => p(value));
		const sibling2 = sharedContext.with(value => span(value));
		const tree = sharedContext.provider("shared", div(sibling1, sibling2));
		expect(renderHTML(tree)).toBe("<div><p>shared</p><span>shared</span></div>");
	});

	it("inner provider of the same context overrides outer provider for its descendants only", () => {
		const themeContext = new Context<string>(() => "light");

		const themedButton = (label: string) => themeContext.with(theme => p(`${label}: ${theme}`));

		const tree = themeContext.provider(
			"dark",
			div(
				themedButton("Button A"),
				themeContext.provider("contrast", themedButton("Button B")),
				themedButton("Button C"),
			),
		);
		expect(renderHTML(tree)).toBe("<div><p>Button A: dark</p><p>Button B: contrast</p><p>Button C: dark</p></div>");
	});

	it("consumer of one context is unaffected by providers of a different context", () => {
		const contextA = new Context<string>(() => "A_default");
		const contextB = new Context<string>(() => "B_default");

		const tree = contextA.provider(
			"Value A",
			contextB.provider(
				"Value B",
				// This consumer should only care about ContextA
				contextA.with(valA => p(`A: ${valA}`)),
			),
		);
		expect(renderHTML(tree)).toBe("<p>A: Value A</p>");
	});
});
