import { describe, it, expect } from "bun:test";
import { try_param_list, try_param_string } from "./value.ts";
import { ParserContext } from "./Context.ts";
import { HypermarkDocument } from "./types.ts";

describe("Value", () => {
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

	describe("try_param_list", () => {
		it("parses a list of values", () => {
			const doc = new HypermarkDocument();
			const ctx = new ParserContext("[1, 2, 3]", doc);
			expect(try_param_list(ctx)).toEqual([1, 2, 3]);
		});

		it("parses a list of values with whitespace", () => {
			const doc = new HypermarkDocument();
			const ctx = new ParserContext("[1\t,\n 2,\n\t3]", doc);
			expect(try_param_list(ctx)).toEqual([1, 2, 3]);
		});

		it("parses a list of values with a trailing comma", () => {
			const doc = new HypermarkDocument();
			const ctx = new ParserContext("[1, 2, 3,]", doc);
			expect(try_param_list(ctx)).toEqual([1, 2, 3]);
		});

		it("parses a list of values with a trailing comma and whitespace", () => {
			const doc = new HypermarkDocument();
			const ctx = new ParserContext("[1, 2, 3,]", doc);
			expect(try_param_list(ctx)).toEqual([1, 2, 3]);
		});

		it("bails on an invalid list", () => {
			const doc = new HypermarkDocument();
			const ctx = new ParserContext("[,]", doc);
			expect(try_param_list(ctx)).toBeUndefined();
		});

		it("bails on an incomplete list", () => {
			const doc = new HypermarkDocument();
			const ctx = new ParserContext("[1, 2, 3", doc);
			expect(try_param_list(ctx)).toBeUndefined();
		});
	});
});
