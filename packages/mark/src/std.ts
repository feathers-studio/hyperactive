import { Block, Inline } from "./types.ts";
import type { Macro } from "./expand.ts";
import { is_marker, read_region } from "./region.ts";

/** Language per extension, where the extension is not the language's own name. */
const LANGUAGES: Record<string, string> = {
	mjs: "js",
	cjs: "js",
	mts: "ts",
	cts: "ts",
	yml: "yaml",
	sh: "bash",
	zsh: "bash",
	md: "markdown",
	hm: "hypermark",
};

function language_of(url: string): string {
	const name = url.split("/").at(-1) ?? "";
	const dot = name.lastIndexOf(".");
	if (dot <= 0) return "";
	const extension = name.slice(dot + 1).toLowerCase();
	return LANGUAGES[extension] ?? extension;
}

/** The text of inline nodes, without their formatting. */
function plain(nodes: Inline[]): string {
	return nodes
		.map(node => {
			if (node.type === "text" || node.type === "code") return node.content;
			if ("content" in node && Array.isArray(node.content)) return plain(node.content);
			return "";
		})
		.join("");
}

/**
 * `=code([bot.ts](../examples/bot.ts), region: "launch", twoslash)`, or the same with
 * `"../examples/bot.ts"` as a plain string.
 *
 * The link exists for GFM renderers, which show it as a working link where Hypermark
 * shows the code. Its text is the title; a string's title is the path as written.
 * `title` and `lang` override; every other parameter is kept for the renderer.
 *
 * A call that cannot be read becomes an empty block and a problem, never an exception:
 * one missing example should not cost the whole page.
 */
export const code: Macro = async (first, named, context) => {
	const { region, lang, title, ...rest } = named;

	let url: string | undefined;
	let link_text: string | undefined;
	if (first instanceof Inline.Link) {
		url = first.url;
		link_text = plain(first.content);
	} else if (typeof first === "string") url = first;

	const options: Block.CodeBlockOptions = {
		language: typeof lang === "string" ? lang : url ? language_of(url) : "",
	};
	const shown = typeof title === "string" ? title : (link_text ?? url);
	if (shown) options.title = shown;
	const params = Object.entries(rest).map(([name, value]) => new Block.Parameter(name, value));
	if (params.length) options.params = new Block.Parameters(params);

	const empty = () => new Block.CodeBlock("", options);

	if (url === undefined) {
		context.report(
			"`=code` needs a file",
			'Write `=code("../examples/bot.ts")`, or `=code([bot.ts](../examples/bot.ts))` to link it on GitHub.',
		);
		return empty();
	}
	if (region !== undefined && typeof region !== "string") {
		context.report("`region` is a name", 'Write `region: "launch"`.');
		return empty();
	}

	const path = context.path(url);
	if (path === undefined) {
		context.report(`${url} is not a file in the project`);
		return empty();
	}

	const source = await context.read(url);
	if (source === undefined) {
		context.report(`Cannot read ${path}`);
		return empty();
	}
	const text = source.replace(/\r\n/g, "\n").replace(/\n$/, "");

	if (region === undefined) {
		const lines = text.split("\n");
		const content = lines.filter(line => !is_marker(line)).join("\n");
		return new Block.CodeBlock(content, options, { url, path, text, lines: { start: 0, end: lines.length } });
	}

	const found = read_region(text, region);
	if (!found.ok) {
		if (found.reason === "unterminated") context.report(`Region "${region}" in ${path} has no #endregion`);
		else if (found.reason === "duplicate") {
			context.report(`Region "${region}" is declared more than once in ${path}`, "Region names are unique within a file.");
		} else {
			const known = found.names.length ? found.names.map(name => `"${name}"`).join(", ") : "none";
			context.report(`${path} has no region "${region}"`, `Regions in this file: ${known}`);
		}
		return empty();
	}

	const { start, end } = found.region;
	return new Block.CodeBlock(found.region.text, options, { url, path, region, text, lines: { start, end } });
};

/** The macros every document has. A site's own macros of the same name replace them. */
export const std: Record<string, Macro> = { code };
