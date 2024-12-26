const interjuncts = ["/", ".", "-"] as const;
type Interjunct = (typeof interjuncts)[number];

type Queries<T extends string> = T extends ""
	? never
	: T extends `${infer First}&${infer Rest}`
	? First extends ""
		? Queries<Rest>
		: First | Queries<Rest>
	: T;

type Params<Path extends string> = string extends Path
	? never
	: Path extends ""
	? never
	: Path extends `${infer Start}:${infer Param}${Interjunct}${infer Rest}`
	? Param extends `${infer _X}${Interjunct}${infer _Y}`
		? never
		: Param extends ""
		? Params<Rest>
		: Param | Params<Rest>
	: Path extends `${infer Start}:${infer Param}`
	? Param extends ""
		? never
		: Param
	: never;

export type Expand<T extends object> = T extends infer O ? { [K in keyof O]: O[K] } : never;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

type NormaliseQueries<Queries extends string> = UnionToIntersection<
	{
		[Q in Queries]: Q extends `${infer Start}[]` ? { [q in Start]: string[] } : { [q in Q]?: string };
	}[Queries]
>;

type Compose<Params extends string, Queries extends string> = {
	params: { [k in Params]: string };
	queries: Expand<NormaliseQueries<Queries> & Partial<Record<string, string>>>;
};

export type ParamsAndQueries<T extends string> = string extends T
	? Compose<string, string>
	: T extends `${infer Path}?${infer Query}`
	? Path extends `${infer PathBase}*`
		? Compose<Params<PathBase>, Queries<Query>>
		: Compose<Params<Path>, Queries<Query>>
	: T extends `${infer PathBase}*`
	? Compose<Params<PathBase>, string>
	: Compose<Params<T>, string>;

export type PathSegment = { type: "literal" | "interjunct" | "param"; value: string };

export class ParseError extends Error {
	constructor(error: string, source: string, at: number) {
		super(`${error} at ${source.slice(0, at + 1)}`);
	}
}

export function parsePathSpec(spec: string) {
	const segments: PathSegment[] = [];

	let buffer = "";
	let param = false;
	let i = 0;

	const flush = () => {
		if (param && !buffer) throw new ParseError("Empty path param is not allowed", spec, i);

		if (buffer) {
			segments.push({ type: param ? "param" : "literal", value: buffer });
			buffer = "";
			param = false;
		}
	};

	while (i < spec.length) {
		const c = spec[i];
		if (interjuncts.includes(c as Interjunct)) {
			flush();
			segments.push({ type: "interjunct", value: c });
		} else if (c === "*") {
			// trailing * case is handled before parsing
			throw new ParseError(`* can only appear at the end of a path spec. Unexpected '${c}'`, spec, i);
		} else if (c === ":") {
			flush();
			param = true;
		} else buffer += c;

		i++;
	}

	flush();

	return segments;
}

export type QuerySegment = { name: string; array: boolean };

export function parseQuerySpec(spec: string) {
	const segments: QuerySegment[] = [];

	let buffer = "";
	let array = false;
	let i = 0;

	const flush = () => {
		if (!buffer) throw new ParseError(`Unnamed query`, spec, i + 1);

		if (buffer) {
			segments.push({ name: buffer, array });
			buffer = "";
			array = false;
		}
	};

	while (i < spec.length) {
		const c = spec[i];

		if (c === "&") {
			flush();
		} else if (c === "[") {
			const next = spec[i + 1];
			if (next !== "]") throw new ParseError(`Expected ']', received ${next ? `'${next}'` : "EOL"}`, spec, i + 2);
			array = true;
			i++;
		} else if (!array && c === "]") {
			throw new ParseError(`Unexpected ']'`, spec, i + 1);
		} else {
			if (array) throw new ParseError(`Unexpected '${c}'`, spec, i + 1);
			buffer += c;
		}

		i++;
	}

	if (buffer) flush();

	return segments;
}

const regEscape = function (s: string) {
	return s.replace(/[\\^$*+?.()|[\]{}]/g, "\\$&");
};

export type SpecOpts = {
	case: "sensitive" | "insensitive";
	slash: "exact" | "ignore" | "redirect" | "redirect-slash" | "redirect-noslash";
};

export function parse(spec: string, opts: SpecOpts) {
	let [p, q = ""] = spec.split("?");

	const exact = opts.slash === "exact";

	if (p.endsWith("/") && !exact) p = p.slice(0, -1);
	if (p.endsWith("/*") && !exact) p = p.slice(0, -2) + "*";
	const variadic = p.endsWith("*");
	// remove trailing * before parsing
	if (variadic) p = p.slice(0, -1);

	const path = parsePathSpec(p);
	const query = parseQuerySpec(q);

	let i = 0;
	const names: string[] = [];
	const set = (s: string) => {
		const x = i++;
		names[x] = s;
		return x;
	};

	const mapped = path.map(node => {
		switch (node.type) {
			case "interjunct":
				return "\\" + node.value;
			case "param":
				return `(?<m${set(node.value)}>[^./-]+)`;
			case "literal":
				return regEscape(node.value);
			// exhaustive because variadic is handled and cannot appear in a non-tail position
		}
	});

	const optional = !exact && !variadic ? "\\/?" : "";

	let reg = new RegExp(
		`^(?<route>${mapped.join("")})${optional}${variadic ? "" : "$"}`,
		opts.case === "insensitive" ? "i" : "",
	);

	const remap = (o?: Record<string, string>) => {
		if (!o) return null;

		return {
			route: o.route,
			params: Object.fromEntries(names.map((name, i) => [name, o["m" + i]])),
		};
	};

	const url = {
		host: "",
		hostname: "",
		href: "",
		origin: "",
		password: "",
		pathname: "",
		port: "",
		protocol: "",
		search: "",
		searchParams: new URLSearchParams(),
		username: "",
		toJSON: () => "",
	};

	return (path: string) => remap(reg.exec(path)?.groups);
}

type x = ParamsAndQueries<"/x~:x/~:y.:p/asa/:z/*">;

type y = ParamsAndQueries<"/:userid/posts/search?contains[]&deepSearch">;

// let x;

// x = fromSpec(`/path/to/:id/users`);
// console.log(x("/path/to/x/users"));

let x = parse(`/x~:x/~:y.:p/asa/:z/*`, { case: "insensitive", slash: "ignore" });
// console.log(x("/x~hello/~world.foo/asa/bar/baz/more/stuff"));

// x = fromSpec(`/x:x/~:y/asa/:z/*?a&b`);
// console.log(x("/xhello/~world/asa/foo/bar"));

// x = fromSpec(`/:yo/-/x~:x/~:y.:p/asa/:z-*?a[]&`);
// console.log(x("/param1/-/x~param2/~param3.param4/asa/param5-unmatched"));

// // "?a&b[]" // { a?: string, b?: string[] }
