import { describe, it, expect } from "bun:test";
import { try_param_string } from "./value.ts";
import { ParserContext } from "./Context.ts";
import { HypermarkDocument } from "./types.ts";

describe("try_param_string", () => {
	it("parses a string surrounded by single quotes", () => {
		const doc = new HypermarkDocument();
		const ctx = new ParserContext("'Hello world'", doc);

		expect(try_param_string(ctx)).toBe("Hello world");
	});

	it("parses a string surrounded by double quotes", () => {
		const doc = new HypermarkDocument();
		const ctx = new ParserContext('"Hello world"', doc);
		expect(try_param_string(ctx)).toBe("Hello world");
	});

	it("parses a string with escaped quotes", () => {
		const doc = new HypermarkDocument();
		const ctx = new ParserContext("'Hello \\'world\\''", doc);
		expect(try_param_string(ctx)).toBe("Hello 'world'");
	});

	it("parses a string with escaped backslashes", () => {
		const doc = new HypermarkDocument();
		const ctx = new ParserContext("'Hello \\\\world\\\\'", doc);
		expect(try_param_string(ctx)).toBe("Hello \\world\\");
	});

	it("parses an incomplete string", () => {
		const doc = new HypermarkDocument();
		const ctx = new ParserContext("'Hello world", doc);
		expect(try_param_string(ctx)).toBeUndefined();
	});

	it("parses a string with a newline", () => {
		const doc = new HypermarkDocument();
		const ctx = new ParserContext("'Hello\nworld'", doc);
		expect(try_param_string(ctx)).toBeUndefined();
	});
});
