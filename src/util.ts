const escapables = {
	"<": "&lt;",
	">": "&gt;",
	"&": "&amp;",
	"'": "&#39;",
	'"': "&quot;",
};

export const escapeHTML = (s: string) =>
	s.replace(/<|>|&|"|'/g, r => escapables[r as keyof typeof escapables] || r);

export type Falsy = false | "" | 0 | 0n | undefined | null;

export const Falsy = new Set([false, "", 0, 0n, undefined, null]);
// deno-lint-ignore no-explicit-any
export const isFalsy = (n: any): n is Falsy => Falsy.has(n);

export type unionFromSet<T> = T extends Set<infer U> ? U : never;
