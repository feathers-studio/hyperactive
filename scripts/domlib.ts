const res = await fetch("https://raw.githubusercontent.com/microsoft/TypeScript/main/lib/lib.dom.d.ts");
const domlib = await res.text();

const NBSP = String.fromCharCode(160);

const sanelib = domlib
	.replace(`\n/// <reference no-default-lib="true"/>\n`, "")
	.replaceAll("...arguments:", "...args:")
	.replaceAll("    ", "\t")
	.replaceAll(NBSP, " ");

const or = (list: string[]) => list.map((each) => `(${each})`).join("|");

const idRegex = "(_|$|[a-zA-Z])(_|$|[a-zA-Z0-9])+";
const body = ".*{(\\n(.+))*\\n}";

const single = String.raw`\/\*\* .+ \*\/`;
const multi = String.raw`\/\*\*(\n.*)+\n\s+\*\/`;

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
		.filter((each) => !tracked.has(each.name))
		.filter((each) => list.some((item) => item.match.includes(each.name)))
		.map((each) => {
			tracked.add(each.name);
			return each;
		});

	if (!filtered.length) return list;
	return exhaust(filtered);
}

exhaust(parsed.filter((each) => each.type === "interface" && tracked.has(each.name)));

const slim = parsed
	.filter((item) => tracked.has(item.name))
	.map((each) => {
		let ret = each.match.slice(1);
		if (each.type === "interface") ret = "export " + ret;
		if (each.doc) ret = each.doc + "\n" + ret;

		return ret;
	})
	.join("\n");

const preface = `
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
`.trim();

await Deno.writeTextFile("vendor/dom.slim.ts", preface + "\n" + slim);

// force this to be an ESM
export {};
