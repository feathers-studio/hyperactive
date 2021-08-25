// declare expected globals to avoid ts-ignore
declare const process: { version: unknown };
declare const window: { Deno: unknown; document: unknown };

export const guessEnv = () => {
	if (typeof process !== "undefined" && process.version) return "node";
	if (typeof window !== "undefined") {
		if (window.Deno) return "deno";
		if (window.document) return "browser";
	}
	return undefined;
};
