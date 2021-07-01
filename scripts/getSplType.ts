import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.12-alpha/deno-dom-wasm.ts";

const html = await fetch(
	"https://html.spec.whatwg.org/multipage/indices.html",
).then(res => res.text());

const document = new DOMParser().parseFromString(html, "text/html")!;

const rows = [...document.querySelectorAll("#attributes-1 tbody tr")]
	.map(row => [...row.children])
	.map(([name, , , value]) => ({
		name: name.textContent.trim(),
		value: value.textContent.trim(),
	}));

type Entry = [string, (el: string) => string | null];

const boolean: Entry[] = [
	...new Set(
		rows
			.filter(row => row.value === "Boolean attribute")
			.map(row => row.name),
	),
].map(name => [name, () => "boolean"]);

const isEnum = /(".+";\s*)*(".+"\s*)/;

const union = (...parts: string[]) =>
	parts.map(part => `"${part}"`).join(" | ");

const mime = "`${string}/${string}`";

const manual: Entry[] = [
	["as", () => `string`],
	["step", () => `number | "any"`],
	[
		"dir",
		(el: string) =>
			el === "bdo" ? union("ltr", "rtl") : union("ltr", "rtl", "auto"),
	],
	[
		"type",
		(el: string) =>
			({
				a: mime,
				link: mime,
				embed: mime,
				object: mime,
				source: mime,
				button: union("submit", "reset", "button"),
				ol: union("1", "a", "A", "i", "I"),
				script: `"module" | ${mime}`,
				input: union(
					"hidden",
					"text",
					"search",
					"tel",
					"url",
					"email",
					"password",
					"date",
					"month",
					"week",
					"time",
					"datetime",
					"number",
					"range",
					"color",
					"checkbox",
					"radio",
					"file",
					"submit",
					"image",
					"reset",
					"button",
				),
			}[el] || null),
	],
];

const parseEnum = (str: string) =>
	[...str.matchAll(/"\S+"/g)].flat().map(each => each.replaceAll('"', ""));

const enums = rows
	.filter(row => isEnum.test(row.value.trim()))
	.filter(row => !manual.map(each => each[0]).includes(row.name))
	.map(row => [row.name, union(...(parseEnum(row.value) || []))])
	.map(([name, union]): Entry => [name, () => union]);

const def = () => null;

const specialTypes = Object.fromEntries(
	([] as Entry[]).concat(boolean, enums, manual),
);

const specialKeys = new Set(Object.keys(specialTypes));

export const isSpecial = (attr: string) => specialKeys.has(attr);

export const getSplType = (attr: string) => specialTypes[attr] || def;
