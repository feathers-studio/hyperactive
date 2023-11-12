const escapables = {
	"<": "&lt;",
	">": "&gt;",
	"&": "&amp;",
	"'": "&#39;",
	'"': "&quot;",
};

export const escapeAttr = (s: string) => s.replace(/<|>|&|"|'/g, r => escapables[r as keyof typeof escapables] || r);

export const escapeTextNode = (s: string) => s.replace(/<|>|&/g, r => escapables[r as keyof typeof escapables] || r);

export type SetContents<T> = T extends Set<infer U> ? U : never;

// no 0n since bigint support is 2020+
export const Falsy = new Set([false, "", 0, null, undefined] as const);

export type Falsy = SetContents<typeof Falsy>;

// deno-lint-ignore no-explicit-any
export const isFalsy = (n: any): n is Falsy => Falsy.has(n);

export type Keyof<O> = Extract<keyof O, string>;
