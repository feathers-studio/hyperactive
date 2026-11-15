import { describe, it, expect } from "bun:test";
import { dedent, read_region, region_names } from "./region.ts";

const FILE = [
	'import { Telegraf } from "telegraf";',
	"",
	"// #region construct",
	"const bot = new Telegraf(TOKEN);",
	"// #endregion",
	"",
	"// #region launch",
	"bot.launch();",
	"// #endregion",
].join("\n");

describe("Region", () => {
	it("reads the lines between a region's markers", () => {
		const result = read_region(FILE, "launch");
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.region.text).toBe("bot.launch();");
		// Indices into the file as it is, which twoslash slices by.
		expect(FILE.split("\n")[result.region.start]).toBe("bot.launch();");
		expect(FILE.split("\n")[result.region.end]).toBe("// #endregion");
	});

	it("lists every region name, in order", () => {
		expect(region_names(FILE)).toEqual(["construct", "launch"]);
	});

	it("does not let a nested region close the one around it", () => {
		const source = ["// #region outer", "a;", "// #region inner", "b;", "// #endregion", "c;", "// #endregion"];
		const result = read_region(source.join("\n"), "outer");
		expect(result.ok && result.region.text).toBe("a;\nb;\nc;");
	});

	it("reports a region with no end rather than running to the end of the file", () => {
		expect(read_region("// #region open\na;\nb;", "open")).toMatchObject({ ok: false, reason: "unterminated" });
	});

	it("names the regions that do exist when one is missing", () => {
		expect(read_region(FILE, "lunch")).toEqual({ ok: false, reason: "missing", names: ["construct", "launch"] });
	});

	it("reports a name declared twice rather than taking the first", () => {
		const source = ["// #region x", "a;", "// #endregion", "// #region x", "b;", "// #endregion"];
		expect(read_region(source.join("\n"), "x")).toMatchObject({ ok: false, reason: "duplicate" });
	});

	it("recognises the comment leaders of other languages", () => {
		expect(read_region("# #region sh\necho hi\n# #endregion", "sh").ok).toBe(true);
		expect(read_region("-- #region sql\nSELECT 1;\n-- #endregion", "sql").ok).toBe(true);
		expect(read_region("/* #region css */\na { color: red }\n/* #endregion */", "css").ok).toBe(true);
	});

	it("dedents a region and trims the blank lines framing it", () => {
		const source = ["function f() {", "\t// #region body", "", "\tif (a) {", "\t\treturn a;", "\t}", "", "\t// #endregion", "}"];
		const result = read_region(source.join("\n"), "body");
		// The outer tab goes; the `return`'s own indent stays.
		expect(result.ok && result.region.text).toBe("if (a) {\n\treturn a;\n}");
	});

	it("leaves blank lines empty when dedenting", () => {
		expect(dedent(["\t\ta;", "", "\t\tb;"])).toEqual(["a;", "", "b;"]);
	});
});
