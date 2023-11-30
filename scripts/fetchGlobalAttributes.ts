// TODO(mkr): various issues with this script, possibly demands a cleaner parser rewrite

import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.12-alpha/deno-dom-wasm.ts";

import { getSpecialType } from "./util/getSpecialType.ts";
import * as typer from "./util/hypertyper.ts";
import { Element } from "../hyper/vendor/dom.slim.ts";

const html = await fetch("https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes").then(res => res.text());
const document = new DOMParser().parseFromString(html, "text/html")!;

const exists = <T>(x: T | null | undefined): x is T => x != null;

const chunk = <T>(arr: T[], size: number) =>
	Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

const globalAttr = chunk(
	[...document.querySelectorAll('section[aria-labelledby="list_of_global_attributes"] dl')]
		//
		.flatMap(x => [...x.children]),
	2,
)
	.map(([dt, dd]): typer.Prop => {
		const prop = dt.textContent.trim();
		const desc = dd.textContent.trim();
		const ul = (dd as unknown as Element).querySelector("ul");
		const type =
			getSpecialType(prop)(prop) ||
			(ul
				? typer.collectString(
						typer.union(
							Array.from(ul.querySelectorAll("li code"))
								.map(code => code.textContent?.trim())
								.filter(exists),
						),
				  )
				: "string");

		return { prop, desc, type };
	})
	.filter(
		each =>
			!(
				// remove props matching these conditions
				(
					each.prop === "virtualkeyboardpolicy" || // re-evaluate later, MDN doesn't mark this as experimental in this location
					each.prop === "role" || // will be added by fetchARIA.ts
					each.prop === "data-*" || // will be re-added manually as data-${string} in fetchAttributes.ts
					each.prop.includes("Deprecated") ||
					each.prop.includes("Experimental")
				)
			),
	);

const globalAttrType = typer.exports(typer.iface("GlobalAttrs", typer.struct(globalAttr)));

{
	const target = "./hyper/lib/global-attributes.ts";
	console.log(`Writing ${target}`);
	typer.writer(
		target,
		typer.program(`import { Falsy } from "../util.ts";`, `type MaybeString = string | Falsy;`, globalAttrType),
	);
}
