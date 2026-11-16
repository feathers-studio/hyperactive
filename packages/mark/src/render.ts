import { h, type HyperNodeish } from "@hyperactive/hyper";
import type { Problem } from "./expand.ts";
import { slugger } from "./slug.ts";
import type { Block, HypermarkDocument, Inline, Point, Position, Value } from "./types.ts";

/**
 * A function a call or decorator renders with: `=name(first, key: value)` runs
 * `name(first, { key: value }, context)`, and what it returns stands where the node was.
 *
 * Write a macro instead whenever the result can be Hypermark nodes: those reach every
 * renderer, while a component's output reaches only this one.
 */
export type Component = (
	first: Value | undefined,
	named: Record<string, Value>,
	context: RenderContext,
) => HyperNodeish;

export interface RenderContext {
	/** The node being rendered, as parsed. A decorator's `blocks` hold the block it decorates. */
	node: Block.Call | Block.Decorator;
	/** The standard rendering of blocks or inline nodes, for the parts a component doesn't take apart. */
	render(nodes: readonly (Block | Inline)[]): HyperNodeish[];
	/** Record a problem with this node. Rendering carries on. */
	report(message: string, hint?: string): void;
}

export interface RenderOptions {
	/** Looked up by a call's or decorator's name. */
	components?: Record<string, Component>;
}

export interface RenderResult {
	/**
	 * The document, footnotes last, for `renderHTML` or `renderDOM` one by one. A list rather than
	 * one node: Hyperactive writes an array's ends as `<!---->` in HTML.
	 */
	nodes: HyperNodeish[];
	problems: Problem[];
}

/**
 * Render a document as Hyperactive nodes, as GitHub renders the Markdown that Hypermark shares.
 *
 * Synchronous: anything that needs I/O is a macro, which `expand` runs first. A call or
 * decorator with no component is reported and rendered without one, never left out silently.
 */
export function render(doc: HypermarkDocument, options: RenderOptions = {}): RenderResult {
	const components = options.components ?? {};
	const problems: Problem[] = [];
	const slug = slugger();

	// Footnotes are numbered in the order of their first reference, as on GitHub.
	const referenced: string[] = [];
	const uses = new Map<string, number>();

	const report = (node: { position?: Position }, message: string, hint?: string) => {
		problems.push({
			message,
			...(hint ? { hint } : {}),
			...(node.position ? { position: node.position } : {}),
		});
	};

	function nodes(list: readonly (Block | Inline)[]): HyperNodeish[] {
		return list.flatMap(node);
	}

	function node(n: Block | Inline): HyperNodeish[] {
		switch (n.type) {
			case "paragraph":
				return [h("p", {}, ...nodes(n.content))];
			case "heading":
				return [h(`h${n.level}`, { id: slug(text(n.content)) }, ...nodes(n.content))];
			case "list":
				return [list(n)];
			case "code-block":
				return [code_block(n)];
			case "quote":
				return [h("blockquote", {}, ...nodes(n.content))];
			case "rule":
				return [h("hr", {})];
			case "table":
				return [table(n)];
			case "call":
				return call(n);
			case "decorator":
				return decorator(n);
			// Footnotes render together at the end. Comments are for whoever edits the source.
			case "footnote":
			case "comment":
				return [];

			case "text":
				return [n.content];
			case "emphasis":
				return [h("em", {}, ...nodes(n.content))];
			case "strong":
				return [h("strong", {}, ...nodes(n.content))];
			// GitHub renders `~text~` as `del`.
			case "strike":
				return [h("del", {}, ...nodes(n.content))];
			case "code":
				return [h("code", {}, n.content)];
			case "link":
				return link(n);
			case "image":
				return image(n);
			case "footnote-reference":
				return footnote_reference(n);
			case "interpolation":
				report(n, `\`${n}\` has no value`, "Variables are not supported yet. Write `\\${` to show the text.");
				return [n.toString()];
		}
	}

	function list(n: Block.List): HyperNodeish {
		const loose = is_loose(n);
		const items = n.items.map(item => list_item(item, loose));
		const attrs = n.items.some(item => item.type === "task-item") ? { class: "contains-task-list" } : {};
		if (!n.options?.ordered) return h("ul", attrs, ...items);
		const start = Number.parseInt(n.options.start_marker, 10);
		return h("ol", start === 1 ? attrs : { ...attrs, start }, ...items);
	}

	function list_item(item: Block.ListItem | Block.TaskItem, loose: boolean): HyperNodeish {
		// A tight list's paragraphs are their text alone, as GitHub renders them.
		const blocks = (list: Block[]) =>
			list.flatMap(block => (!loose && block.type === "paragraph" ? nodes(block.content) : node(block)));
		const [first, ...rest] = item.content;

		if (item.type === "task-item") {
			const attrs = { class: "task-list-item" };
			const box = h("input", { type: "checkbox", disabled: true, checked: item.checked });
			if (first?.type !== "paragraph") return h("li", attrs, box, ...blocks(item.content));
			// The text follows the box on its line, inside the first paragraph of a loose item.
			if (loose) return h("li", attrs, h("p", {}, box, " ", ...nodes(first.content)), ...blocks(rest));
			return h("li", attrs, box, " ", ...blocks(item.content));
		}

		if (!item.label) return h("li", {}, ...blocks(item.content));
		// What a label means is up to a component; in a plain list it is a name to style.
		const label = h("span", { class: "item-label" }, ...nodes(item.label));
		if (!loose && first?.type === "paragraph") return h("li", {}, label, " ", ...blocks(item.content));
		return h("li", {}, label, ...blocks(item.content));
	}

	function code_block(n: Block.CodeBlock): HyperNodeish {
		const language = n.options?.language;
		const code = h("code", language ? { class: `language-${language}` } : {}, n.content);
		// Focusable, so a block wider than the page scrolls from the keyboard.
		const pre = h("pre", { tabindex: 0 }, code);
		const title = n.options?.title;
		return title === undefined ? pre : h("figure", {}, h("figcaption", {}, title), pre);
	}

	function table(n: Block.Table): HyperNodeish {
		const cell = (tag: "th" | "td", content: Block.TableCell, column: number) => {
			const align = n.alignments?.alignment[column];
			const attrs = align ? { style: `text-align: ${align}` } : {};
			return h(tag, attrs, ...nodes(content.content));
		};
		const row = (tag: "th" | "td", row: Block.TableRow) =>
			h("tr", {}, ...row.cells.map((content, column) => cell(tag, content, column)));
		return h(
			"table",
			{},
			n.header && h("thead", {}, row("th", n.header)),
			n.rows.length > 0 && h("tbody", {}, ...n.rows.map(r => row("td", r))),
		);
	}

	function component_for(name: string): Component | undefined {
		// Own properties only, as for macros: `=constructor()` must not find Object.prototype.constructor.
		return Object.hasOwn(components, name) ? components[name] : undefined;
	}

	function call(n: Block.Call): HyperNodeish[] {
		// The call as written, so a missing component shows where it is instead of leaving a gap.
		const fallback = () => [h("p", {}, n.toString())];
		const component = component_for(n.name);
		if (component !== undefined) return run(component, n, fallback);
		report(n, `No macro or component is called \`${n.name}\``, "The call renders as its source text.");
		return fallback();
	}

	function decorator(n: Block.Decorator): HyperNodeish[] {
		const fallback = () => nodes(n.blocks);
		const component = component_for(n.name);
		if (component !== undefined) return run(component, n, fallback);
		report(n, `No component is called \`${n.name}\``, "The block it decorates renders without it.");
		return fallback();
	}

	function run(component: Component, n: Block.Call | Block.Decorator, fallback: () => HyperNodeish[]) {
		const { first, named } = arguments_of(n.parameters);
		const context: RenderContext = {
			node: n,
			render: nodes,
			report: (message, hint) => report(n, message, hint),
		};
		try {
			return flatten(component(first, named, context));
		} catch (error) {
			report(n, `\`${n.name}\` failed: ${(error as Error).message}`);
			return fallback();
		}
	}

	function link(n: Inline.Link): HyperNodeish[] {
		const scheme = unsafe_scheme(n.url);
		if (scheme === undefined) return [h("a", { href: n.url }, ...nodes(n.content))];
		report(n, `\`${scheme}:\` links are not rendered`, "The link renders as its text.");
		return nodes(n.content);
	}

	function image(n: Inline.Image): HyperNodeish[] {
		const alt = text(n.content);
		const scheme = unsafe_scheme(n.url);
		if (scheme === undefined) return [h("img", { src: n.url, alt })];
		report(n, `\`${scheme}:\` images are not rendered`, "The image renders as its alt text.");
		return [alt];
	}

	function footnote_reference(n: Inline.FootnoteReference): HyperNodeish[] {
		const { reference } = n;
		// Own properties only: `[^constructor]` must not find Object.prototype.constructor.
		if (!Object.hasOwn(doc.footnote_collection, reference)) {
			report(n, `No footnote is called \`${reference}\``, "The reference renders as its source text.");
			return [n.toString()];
		}
		if (!uses.has(reference)) referenced.push(reference);
		const use = (uses.get(reference) ?? 0) + 1;
		uses.set(reference, use);

		const id = anchor(reference);
		const attrs = {
			"href": `#fn-${encodeURIComponent(id)}`,
			"id": `fnref-${id}${use > 1 ? `-${use}` : ""}`,
			"data-footnote-ref": "",
			"aria": { describedby: "footnote-label" },
		};
		return [h("sup", {}, h("a", attrs, referenced.indexOf(reference) + 1))];
	}

	/** GitHub's footnote section: each referenced footnote, with a link back to every reference. */
	function footnotes(): HyperNodeish[] {
		const items: HyperNodeish[] = [];
		// A footnote may reference another, which joins the end of `referenced` as it renders.
		for (let i = 0; i < referenced.length; i++) {
			const reference = referenced[i]!;
			const content = nodes(doc.footnote_collection[reference]!.content);
			const id = anchor(reference);
			const backrefs = Array.from({ length: uses.get(reference)! }, (_, k) => {
				const use = k + 1;
				const suffix = use > 1 ? `-${use}` : "";
				const attrs = {
					"href": `#fnref-${encodeURIComponent(id)}${suffix}`,
					"data-footnote-backref": "",
					"class": "data-footnote-backref",
					"aria": { label: `Back to reference ${i + 1}${suffix}` },
				};
				return h("a", attrs, "↩", use > 1 && h("sup", {}, use));
			});
			items.push(h("li", { id: `fn-${id}` }, h("p", {}, ...content, ...backrefs.flatMap(a => [" ", a]))));
		}
		if (items.length === 0) return [];

		const attrs = { "class": "footnotes", "data-footnotes": "" };
		const heading = h("h2", { id: "footnote-label", class: "sr-only" }, "Footnotes");
		return [h("section", attrs, heading, h("ol", {}, ...items))];
	}

	const body = nodes(doc.blocks);
	return { nodes: [...body, ...footnotes()], problems };
}

/** A call's or decorator's parameters, as a component takes them. */
function arguments_of(parameters: Block.Parameters) {
	// No syntax produces a call as a parameter value, so every value here is a Value.
	const values = parameters.parameters;
	const first = values.find(p => p.name === "__default")?.value as Value | undefined;
	const named: Record<string, Value> = {};
	for (const p of values) if (p.name !== "__default") named[p.name] = p.value as Value;
	return { first, named };
}

// Spread into the parent instead: Hyperactive writes an array's ends as `<!---->` in HTML.
const flatten = (node: HyperNodeish): HyperNodeish[] => (Array.isArray(node) ? node.flatMap(flatten) : [node]);

/** The text of inline nodes, as a heading's id and an image's alt text read it. */
function text(nodes: readonly Inline[]): string {
	return nodes
		.map(node => {
			switch (node.type) {
				case "text":
				case "code":
					return node.content;
				case "emphasis":
				case "strong":
				case "strike":
				case "link":
					return text(node.content);
				// Neither is text in the rendered heading GitHub's ids are read from.
				case "image":
				case "footnote-reference":
					return "";
				case "interpolation":
					return node.toString();
			}
		})
		.join("");
}

/**
 * Whether GitHub would render a list loose, its paragraphs in `<p>`: a blank line between two
 * items, or between two parts of one. Read from positions, so a list a macro made is tight.
 */
function is_loose(list: Block.List): boolean {
	const blank = (a?: Point, b?: Point) => a !== undefined && b !== undefined && b.line > a.line + 1;
	return list.items.some((item, i) => {
		if (i > 0 && blank(list.items[i - 1]!.position?.end, item.position?.start)) return true;
		// From the item's first line, which may hold only its label, through each of its blocks.
		let last = item.position?.start;
		for (const block of item.content) {
			if (blank(last, block.position?.start)) return true;
			last = block.position?.end;
		}
		return false;
	});
}

// Browsers skip leading spaces and control characters, and tabs and newlines anywhere, before
// they read a scheme: `java\nscript:` runs.
const UNSAFE = /^(javascript|vbscript|data):/i;

/** The scheme of a URL that would run script or embed a document, if it has one. */
function unsafe_scheme(url: string): string | undefined {
	const match = url
		.replace(/[\t\n\r]/g, "")
		.replace(/^[\x00-\x20]+/, "")
		.match(UNSAFE);
	return match?.[1]!.toLowerCase();
}

// An id can't hold whitespace. A link to one is percent-encoded, and browsers decode it to match.
const anchor = (reference: string) => reference.replace(/\s+/g, "-");
