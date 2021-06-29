import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.12-alpha/deno-dom-wasm.ts";

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

	const attributes = [...document.querySelectorAll("#index_state_prop code")]
		.map(each => each.textContent.trim())
		.filter(Boolean)
		.map(each => `"${each.replace("aria-", "")}"`);

	const types = [
		"export type AriaAttributes = Partial<",
		"	Record<",
		`		| ${attributes.join("\n\t\t| ")},`,
		"		string",
		"	>",
		">;\n",
	].join("\n");

	Deno.writeTextFileSync("./src/aria.ts", types, { append: true });
}
