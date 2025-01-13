import { describe, it, expect } from "bun:test";
import { try_param_list, try_param_object, try_param_string } from "./value.ts";
import { ParserContext } from "./Context.ts";
import { HypermarkDocument } from "./types.ts";

const getCtx = (input: string) => {
	const doc = new HypermarkDocument();
	return new ParserContext(input, doc);
};

describe("Value", () => {
	describe("try_param_string", () => {
		it("parses a string surrounded by single quotes", () => {
			const ctx = getCtx("'Hello world'");

			expect(try_param_string(ctx)).toBe("Hello world");
		});

		it("parses a string surrounded by double quotes", () => {
			const ctx = getCtx('"Hello world"');
			expect(try_param_string(ctx)).toBe("Hello world");
		});

		it("parses a string with escaped quotes", () => {
			const ctx = getCtx("'Hello \\'world\\''");
			expect(try_param_string(ctx)).toBe("Hello 'world'");
		});

		it("parses a string with escaped backslashes", () => {
			const ctx = getCtx("'Hello \\\\world\\\\'");
			expect(try_param_string(ctx)).toBe("Hello \\world\\");
		});

		it("parses an incomplete string", () => {
			const ctx = getCtx("'Hello world");
			expect(try_param_string(ctx)).toBeUndefined();
		});

		it("parses a string with a newline", () => {
			const ctx = getCtx("'Hello\nworld'");
			expect(try_param_string(ctx)).toBeUndefined();
		});
	});

	describe("try_param_list", () => {
		it("parses a list of values", () => {
			const ctx = getCtx("[1, 2, 3]");
			expect(try_param_list(ctx)).toEqual([1, 2, 3]);
		});

		it("parses a list of values with whitespace", () => {
			const ctx = getCtx("[1\t,\n 2,\n\t3]");
			expect(try_param_list(ctx)).toEqual([1, 2, 3]);
		});

		it("parses a list of values with a trailing comma", () => {
			const ctx = getCtx("[1, 2, 3,]");
			expect(try_param_list(ctx)).toEqual([1, 2, 3]);
		});

		it("parses a list of values with a trailing comma and whitespace", () => {
			const ctx = getCtx("[1, 2, 3,]");
			expect(try_param_list(ctx)).toEqual([1, 2, 3]);
		});

		it("bails on an invalid list", () => {
			const ctx = getCtx("[,]");
			expect(try_param_list(ctx)).toBeUndefined();
		});

		it("bails on an incomplete list", () => {
			const ctx = getCtx("[1, 2, 3");
			expect(try_param_list(ctx)).toBeUndefined();
		});
	});

	describe("try_param_object", () => {
		it("parses an empty object", () => {
			const ctx = getCtx("{}");
			expect(try_param_object(ctx)).toEqual({});
		});

		it("parses an object with simple keys", () => {
			const ctx = getCtx("{a: 1, b: 2, c: 3}");
			expect(try_param_object(ctx)).toEqual({ a: 1, b: 2, c: 3 });
		});

		it("parses an object with simple keys with trailing commas", () => {
			const ctx = getCtx("{a: 1, b: 2, c: 3,}");
			expect(try_param_object(ctx)).toEqual({ a: 1, b: 2, c: 3 });
		});

		it("parses an object with some quoted keys", () => {
			const ctx = getCtx('{"a bird": 1, "by plane": 2, cat: 3}');
			expect(try_param_object(ctx)).toEqual({ "a bird": 1, "by plane": 2, "cat": 3 });
		});

		it("parses an object with a trailing comma", () => {
			const ctx = getCtx('{"a": 1, "b": 2, "c": 3,}');
			expect(try_param_object(ctx)).toEqual({ a: 1, b: 2, c: 3 });
		});

		it("parses an object with a trailing comma and whitespace", () => {
			const ctx = getCtx('{\t"a": 1,\n "b": 2, \t "c"\n: 3,}');
			expect(try_param_object(ctx)).toEqual({ a: 1, b: 2, c: 3 });
		});

		it("bails on an invalid object", () => {
			const ctx = getCtx("{a: 1 b: 2, c: 3}");
			expect(try_param_object(ctx)).toBeUndefined();
		});

		it("bails if the object is incomplete", () => {
			const ctx = getCtx('{"a": 1, "b": 2, "c": 3');
			expect(try_param_object(ctx)).toBeUndefined();
		});

		it("bails if the object has too many commas", () => {
			{
				const ctx = getCtx('{"a": 1, "b": 2,, "c": 3,}');
				expect(try_param_object(ctx)).toBeUndefined();
			}
			{
				const ctx = getCtx('{"a": 1, "b": 2,"c": 3,,}');
				expect(try_param_object(ctx)).toBeUndefined();
			}
		});
	});
});
