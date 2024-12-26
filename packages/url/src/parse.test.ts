import { test, expect } from "bun:test";
import { parsePathSpec } from "./parse.ts";

test("parsePathSpec", () => {
	const x = parsePathSpec("/x~:x/~:y.:p/asa/:z/");
	expect(x).toEqual([
		{ type: "interjunct", value: "/" },
		{ type: "literal", value: "x~" },
		{ type: "param", value: "x" },
		{ type: "interjunct", value: "/" },
		{ type: "literal", value: "~" },
		{ type: "param", value: "y" },
		{ type: "interjunct", value: "." },
		{ type: "param", value: "p" },
		{ type: "interjunct", value: "/" },
		{ type: "literal", value: "asa" },
		{ type: "interjunct", value: "/" },
		{ type: "param", value: "z" },
		{ type: "interjunct", value: "/" },
	]);
});
