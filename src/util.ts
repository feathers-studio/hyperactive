const escapables = {
	"<": "&lt;",
	">": "&gt;",
	"&": "&amp;",
	"'": "&#39;",
	'"': "&quot;",
};

export const escapeAttr = (s: string) =>
	s.replace(/<|>|&|"|'/g, r => escapables[r as keyof typeof escapables] || r);

export const escapeTextNode = (s: string) =>
	s.replace(/<|>|&/g, r => escapables[r as keyof typeof escapables] || r);

// no 0n since bigint support is 2020+
export type Falsy = false | "" | 0 | undefined | null;

export const Falsy = new Set<Falsy>([false, "", 0, undefined, null]);

// deno-lint-ignore no-explicit-any
export const isFalsy = (n: any): n is Falsy => Falsy.has(n);

export type unionFromSet<T> = T extends Set<infer U> ? U : never;
