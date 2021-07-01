import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.12-alpha/deno-dom-wasm.ts";

import { propsToType } from "./codegen.ts";

const chunk = <X extends unknown>(arr: X[], size: number): X[][] =>
	Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
		arr.slice(i * size, i * size + size),
	);

{
	const html = await fetch("https://w3c.github.io/using-aria/")
		//
		.then(res => res.text());

	const document = new DOMParser().parseFromString(html, "text/html")!;

	const roles = [
		...document.querySelector("#html-aria-gaps > section > ol")!.childNodes,
	]
		.map(each => each.textContent.trim().replace(/`/g, ""))
		.filter(Boolean)
		.map(each => `"${each}"`);

	const types = [
		"export type AriaRoles =",
		`	| ${roles.join("\n\t| ")};\n\n`,
	].join("\n");

	Deno.writeTextFileSync("./src/aria.ts", types);
}

{
	const html = await fetch(
		"https://www.w3.org/TR/wai-aria-1.0/states_and_properties",
	).then(res => res.text());

	const document = new DOMParser().parseFromString(html, "text/html")!;

	const allData = [
		...document.querySelectorAll(
			"#index_state_prop dt, #index_state_prop dd",
		),
	];

	const attributeTypes = propsToType(
		"AriaAttributes",
		chunk(allData, 2).map(([dt, dd]) => ({
			prop: dt.textContent.replace(/\(state\)|aria-/g, "").trim(),
			desc: dd.textContent.trim(),
			type: "string",
		})),
		{ root: true, partial: true },
	);

	const types = ["export type " + attributeTypes + "\n"].join("\n");

	Deno.writeTextFileSync("./src/aria.ts", types, { append: true });
}
