// hypertyper ⚡️

export const eol = "\n";

export function* exports(type: Generator<string>) {
	const first = type.next();
	yield `export ${first.value}`;
	yield* type;
}

export function* split(str: string, delimiter: string) {
	for (const part of str.split(delimiter)) yield part;
}

export function* type(name: string, type: string | Generator<string>) {
	const iter = typeof type === "string" ? split(type, eol) : type;

	let first = iter.next();
	yield `type ${name} = ${first.value}`;
	yield* iter;
}

const docLineStart = " * ";

export const docLine = (line: string) => {
	line = line.trim();
	if (!line) return docLineStart;

	line = line.replace(/<|>/g, s => ({ "<": "`<", ">": ">`" }[s as "<" | ">"]));
	if (line.startsWith("Note")) line = "> " + line;
	return docLineStart + line;
};

type Prop = {
	prop: string;
	type: string | Prop[];
	desc?: string;
};

const indent = "\t";

export function* desc(desc: string) {
	yield "/**" + eol;
	for (const d of desc.split(eol)) yield docLine(d) + eol;
	yield " */" + eol;
}

const idRegex = /^(_|$|[a-zA-Z])(_|$|[a-zA-Z0-9])*$/;

export function* member(name: string, type: string | Generator<string>, level: number) {
	yield (idRegex.test(name) ? name : `["${name}"]`) + ": ";
	if (typeof type === "string") {
		yield type;
		yield ";";
	} else {
		yield* type;
		if (level > 1) yield ";";
	}
}

export function* struct(members: Prop[], level = 1) {
	yield "{" + eol;

	for (const { prop, type, desc: descr } of members) {
		const proptype = member(prop, Array.isArray(type) ? struct(type, 2) : type, level);
		if (descr) for (const l of desc(descr)) yield indent.repeat(level) + l;
		yield indent.repeat(level);
		yield* proptype;
		yield eol;
	}

	yield indent.repeat(level - 1);
	yield "}";
}

export const union = (list: string[]) => list.join(" | ");

export function* statement(...lines: Generator<string>[]) {
	for (const line of lines) yield* line;
	yield ";";
}

export function* program(statements: (Generator<string> | string)[]) {
	let first = true;
	const xs = typeof statements === "string" ? [[statements]] : statements;
	for (const statement of xs) {
		if (first) first = false;
		else yield eol;
		yield* statement;
		yield eol;
	}
}

const encoder = new TextEncoder();
const encode = encoder.encode.bind(encoder);

export async function writeAll(w: Deno.Writer, arr: Uint8Array) {
	let nwritten = 0;
	while (nwritten < arr.length) {
		nwritten += await w.write(arr.subarray(nwritten));
	}
}

const sleep = (t: number) => new Promise(r => setTimeout(r, t));

type Opts = { pause?: number };

export const writer = async (filename: string, program: Generator<string>, opts: Opts = {}) => {
	const writer = await Deno.open(filename, { write: true, create: true, truncate: true });

	for (const segment of program) {
		if (opts.pause) await sleep(opts.pause);
		await writeAll(writer, encode(segment));
	}

	writer.close();
};
