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

export const guessEnv = () => {
	if (
		//@ts-ignore global
		typeof process !== "undefined" &&
		//@ts-ignore global
		process.versions &&
		//@ts-ignore global
		process.versions.node
	)
		return "node";
	//@ts-ignore global
	if (typeof window !== "undefined") {
		//@ts-ignore global
		if (window.Deno && window.Deno.version && window.Deno.version.deno)
			return "deno";
		//@ts-ignore global
		if (window.document) return "browser";
	}
	return undefined;
};
