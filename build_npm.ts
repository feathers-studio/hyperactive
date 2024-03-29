import { build } from "https://deno.land/x/dnt@0.30.0/mod.ts";
import { version } from "./version.ts";

await build({
	entryPoints: ["./mod.ts"],
	outDir: "./npm/hyper",
	shims: { deno: "dev" },
	compilerOptions: { target: "ES2019" },
	package: {
		// package.json properties
		name: "@hyperactive/hyper",
		version,
		description: "hyperactive is a library for building high performant server or client-rendered web interfaces.",
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
Deno.copyFileSync("LICENSE", "npm/hyper/LICENSE");
Deno.copyFileSync("README.md", "npm/hyper/README.md");
Deno.copyFileSync("hpr-trgwii.jpg", "npm/hyper/hpr-trgwii.jpg");
