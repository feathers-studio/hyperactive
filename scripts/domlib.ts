const res = await fetch("https://raw.githubusercontent.com/microsoft/TypeScript/main/lib/lib.dom.d.ts");
const domlib = await res.text();

const sanelib = domlib
	.replaceAll("\ninterface", "\nexport interface")
	.replace(`\n/// <reference no-default-lib="true"/>\n`, "");

const idRegex = "(_|$|[a-zA-Z])(_|$|[a-zA-Z0-9])+";
const body = ".*{(\\n(.+))*\\n}";
const doc = String.raw`\/\*\*.*(((\n\s*\*.*)*\n\s*\*\/)|(\*\/))`;

const iface = `\nexport interface (?<interface>${idRegex})${body}`;
const type = `\ntype (?<type>${idRegex}).*`;
const declareVar = `\ndeclare var (?<declareVar>${idRegex})${body}`;
const declareFun = `\ndeclare function (?<declareFun>${idRegex}).*`;

const constructed = `(?<doc>${doc})?(?<match>${[iface, type, declareVar, declareFun]
	.map(each => `(${each})`)
	.join("|")})`;

function* exec(str: string, regexp: RegExp | string, flags?: string): Generator<RegExpExecArray> {
	if (typeof regexp === "string") regexp = new RegExp(regexp);
	if (flags) regexp = new RegExp(regexp, flags);

	let result;
	while ((result = regexp.exec(str))) {
		yield result;
	}
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

const parsed = [...exec(sanelib, constructed, "g")]
	.map(({ groups: { match, doc, ...groups } = {} }): ParsedItem | undefined => {
		const { key, value } = getType(groups) || {};

		if (key && value)
			return {
				name: value,
				type: key as ParsedItem["type"],
				match: match,
				...(doc && { doc }),
			};
	})
	.filter((each): each is ParsedItem => !!each);

const tracked = new Set(["GlobalEventHandlersEventMap", "HTMLElement", "Text", "Node", "Document"]);

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
	return exhaust(list.concat(filtered));
}

exhaust(parsed.filter(each => each.type === "interface" && tracked.has(each.name)));

const slim = parsed
	.filter(item => tracked.has(item.name))
	.map(each => each.match)
	.join("")
	.replaceAll("...arguments:", "...args:")
	.replaceAll("    ", "\t");

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

await Deno.writeFile("vendor/dom.slim.ts", new TextEncoder().encode(preface + "\n" + slim));
