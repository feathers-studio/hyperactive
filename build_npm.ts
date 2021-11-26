import { build } from "https://deno.land/x/dnt/mod.ts";
import { version } from "./version.ts";

await build({
	entryPoints: ["./mod.ts"],
	outDir: "./npm",
	package: {
		// package.json properties
		name: "@hyperactive/hyper",
		version,
		description:
			"hyperactive is a library for building high performant server or client-rendered web interfaces.",
		license: "MIT",
		repository: {
			type: "git",
			url: "git+https://github.com/codefeathers/hyperactive.git",
		},
		bugs: {
			url: "https://github.com/codefeathers/hyperactive/issues",
		},
	},
});

// post build steps
Deno.copyFileSync("LICENSE", "npm/LICENSE");
Deno.copyFileSync("README.md", "npm/README.md");
Deno.copyFileSync("hpr-trgwii.jpg", "npm/hpr-trgwii.jpg");
