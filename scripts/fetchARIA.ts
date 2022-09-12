import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.12-alpha/deno-dom-wasm.ts";

import * as typer from "./util/hypertyper.ts";

const chunk = <X extends unknown>(arr: X[], size: number): X[][] =>
	Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

const target = "./hyper/lib/aria.ts";

{
	Deno.writeTextFileSync(target, typer.preamble + "\n\n");
}

{
	const html = await fetch("https://w3c.github.io/using-aria/")
		//
		.then(res => res.text());

	const document = new DOMParser().parseFromString(html, "text/html")!;

	const roles = [...document.querySelector("#html-aria-gaps > section > ol")!.childNodes]
		.map(each => each.textContent.trim().replace(/`/g, ""))
		.filter(Boolean)
		.map(each => `"${each}"`);

	const types = typer.statement(typer.exports(typer.type("AriaRoles", typer.union(roles))));
	Deno.writeTextFileSync(target, typer.collectString(typer.program(types)) + "\n", { append: true });
}

{
	const html = await fetch("https://www.w3.org/TR/wai-aria-1.0/states_and_properties").then(res => res.text());
	const document = new DOMParser().parseFromString(html, "text/html")!;

	const allData = [...document.querySelectorAll("#index_state_prop dt, #index_state_prop dd")];

	const attributeTypes = typer.type(
		"AriaAttributes",
		typer.withGeneric(
			"Partial",
			typer.struct(
				chunk(allData, 2).map(([dt, dd]) => ({
					prop: dt.textContent.replace(/\(state\)|aria-/g, "").trim(),
					desc: dd.textContent.trim(),
					type: "string",
				})),
			),
		),
	);

	const exported = typer.statement(typer.exports(attributeTypes));
	Deno.writeTextFileSync(target, typer.collectString(typer.program(exported)), { append: true });
}
