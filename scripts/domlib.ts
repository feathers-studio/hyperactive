const res = await fetch("https://unpkg.com/@types/web/index.d.ts");
// unpkg will redirect us to the versioned URL
const version = res.url.split("@types/web@")[1].split("/index.d.ts")[0];
console.log("Using @types/web version", version);
const domlib = await res.text();

const NBSP = String.fromCharCode(160);

const sanelib = domlib
	.replace(`\n/// <reference no-default-lib="true"/>\n`, "")
	.replaceAll("...arguments:", "...args:")
	.replaceAll("    ", "\t")
	.replaceAll(NBSP, " ");

const or = (list: string[]) => list.map(each => `(${each})`).join("|");

const idRegex = "(_|$|[a-zA-Z])(_|$|[a-zA-Z0-9])+";
const body = ".*{(\\n(.+))*?\\n}";

const single = String.raw`\/\*\* .+ \*\/`;
const multi = String.raw`\/\*\*(\n.*?)+\*\/`;

const doc = or([single, multi]);

const iface = `\ninterface (?<interface>${idRegex})${body}`;
const type = `\ntype (?<type>${idRegex}).*`;
const declareVar = `\ndeclare var (?<declareVar>${idRegex})${body};`;
const declareFun = `\ndeclare function (?<declareFun>${idRegex}).*`;

const constructed = RegExp(`(?<doc>${doc})?(?<match>${or([iface, type, declareVar, declareFun])})`, "g");

function* exec(str: string, regexp: RegExp): Generator<RegExpExecArray> {
	let result;
	while ((result = regexp.exec(str))) yield result;
}

function getType(group: { [k: string]: string }) {
	for (const key in group) {
		const value = group[key];
		if (value) return { key, value: group[key] };
	}
}

type ParsedItem = {
	name: string;
	type: "interface" | "type" | "declareVar" | "declareFun";
	match: string;
	doc?: string;
};

const parsed = [...exec(sanelib, constructed)]
	.map(({ groups: { match, doc, ...groups } = {} }): ParsedItem | undefined => {
		const { key, value } = getType(groups) || {};

		if (key && value) {
			return {
				name: value,
				type: key as ParsedItem["type"],
				match: match,
				...(doc && { doc }),
			};
		}
	})
	.filter((each): each is ParsedItem => !!each);

const required = ["GlobalEventHandlersEventMap", "HTMLElement", "Text", "Node", "Document"];
const tracked = new Set(required);

function exhaust(list: ParsedItem[]): ParsedItem[] {
	const filtered = parsed
		// pick the ones we've not already tracked
		.filter(each => !tracked.has(each.name))
		.filter(each => list.some(item => item.match.includes(each.name)))
		.map(each => {
			tracked.add(each.name);
			return each;
		});

	if (!filtered.length) return list;
	return exhaust(filtered);
}

exhaust(parsed.filter(each => each.type === "interface" && tracked.has(each.name)));

const slim = parsed
	.filter(item => tracked.has(item.name))
	.map(each => {
		let ret = each.match.slice(1);
		if (each.type === "interface") ret = "export " + ret;
		if (each.doc) ret = each.doc + "\n" + ret;

		return ret;
	})
	.join("\n");

const preface = `
/*! *****************************************************************************
This lib was borrowed and modified under the Apache 2.0 license from
the @types/web package, originally published by Microsoft Corporation.

See the full license here: https://github.com/microsoft/TypeScript-DOM-lib-generator/blob/main/LICENSE.txt

This modified version is based on @types/web version ${version}.
***************************************************************************** */

export const domLibVersion = "${version}";
`.trim();

await Deno.writeTextFile("hyper/vendor/dom.slim.ts", preface + "\n" + slim);

// force this to be an ESM
export {};
