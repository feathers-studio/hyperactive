// declare expected globals to avoid ts-ignore
declare const process: { version: unknown; isBun?: boolean; versions?: { node?: string; deno?: string; bun?: string } };
declare const window: { Deno: unknown; document: unknown };
declare const navigator: { userAgent: string };

export const guessEnv = () => {
	if (typeof process !== "undefined" && process.version) {
		if (process.isBun) return "bun";
		if (process.versions?.deno) return "deno";
		return "node";
	}
	if (typeof window !== "undefined") {
		if (window.Deno) return "deno";
		if (window.document) return "browser" + (navigator.userAgent ? ` (${navigator.userAgent})` : "");
	}
	return undefined;
};
