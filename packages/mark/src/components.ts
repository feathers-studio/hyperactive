import { h, type HyperNodeish } from "@hyperactive/hyper";
import type { Component, RenderContext } from "./render.ts";
import { text } from "./text.ts";
import type { Block, Inline, Value } from "./types.ts";

/**
 * The list a decorator decorates, or undefined once the reason there is none is reported.
 * Both components take their members from a list, so a group can't merge with its neighbour.
 */
function decorated_list(name: string, context: RenderContext): Block.List | undefined {
	const { node } = context;
	if (node.type !== "decorator") {
		context.report(`\`${name}\` is a decorator`, `Write \`@${name}()\` above a list.`);
		return undefined;
	}
	const [block] = node.blocks;
	if (block?.type === "list") return block;
	context.report(
		`\`@${name}\` decorates a list`,
		"Write one item for each member, with its label alone on the item's first line.",
	);
	return undefined;
}

/** What a component renders when it can't do its job: the node as if it had no component. */
function undecorated(context: RenderContext): HyperNodeish[] {
	const { node } = context;
	return node.type === "decorator" ? context.render(node.blocks) : [h("p", {}, node.toString())];
}

/** An item's label, or undefined once its absence is reported. A task's box is not a label. */
function label_of(
	name: string,
	item: Block.ListItem | Block.TaskItem,
	index: number,
	context: RenderContext,
): Inline[] | undefined {
	if (item.type === "list-item" && item.label) return item.label;
	context.report(
		`Item ${index + 1} of \`@${name}\` has no label`,
		"Write its label alone on the item's first line, as in `- [npm]`.",
	);
	return undefined;
}

function report_named(name: string, named: Record<string, Value>, context: RenderContext) {
	for (const key of Object.keys(named)) context.report(`\`@${name}\` has no parameter \`${key}\``);
}

/**
 * `@details()` above a list: each labelled item is a native collapsible, `<details>` with the
 * label as its `<summary>`, and several make an accordion. It needs no script.
 */
export const details: Component = (first, named, context) => {
	const list = decorated_list("details", context);
	if (list === undefined) return undecorated(context);
	if (first !== undefined) context.report("`@details` takes no title", "Each item's label is its summary.");
	report_named("details", named, context);

	return list.items.flatMap((item, index) => {
		const label = label_of("details", item, index, context);
		// Shown as it is: a `<details>` without a summary would hide it behind the word "Details".
		if (label === undefined) return context.render(item.content);
		const summary = h("summary", {}, ...context.render(label));
		return h("details", {}, summary, ...context.render(item.content));
	});
};

/**
 * `@variants("Package manager")` above a list: alternatives, such as npm and Bun, each item
 * one variant named by its label. They render stacked, readable without script. Showing
 * one at a time as tabs, and remembering the choice, is the site's script: it finds a group
 * by `data-variants`, holding the title, and each variant by `data-variant`, holding its name.
 */
export const variants: Component = (first, named, context) => {
	const list = decorated_list("variants", context);
	if (list === undefined) return undecorated(context);
	if (first !== undefined && typeof first !== "string") {
		context.report("`@variants` takes its title as a string", 'Write `@variants("Package manager")`.');
	}
	report_named("variants", named, context);
	const title = typeof first === "string" ? first : undefined;

	const names = new Set<string>();
	const members = list.items.map((item, index) => {
		const label = label_of("variants", item, index, context);
		// Still a variant, so a script reading the group finds every member in the same place.
		if (label === undefined) return h("div", { class: "variant" }, ...context.render(item.content));

		const name = text(label);
		if (names.has(name)) {
			context.report(
				`\`${name}\` is in \`@variants\` twice`,
				"A script can't tell variants of the same name apart.",
			);
		}
		names.add(name);
		return h(
			"div",
			{ "class": "variant", "data-variant": name },
			h("div", { class: "variant-label" }, ...context.render(label)),
			...context.render(item.content),
		);
	});

	const attrs = { "class": "variants", "data-variants": title ?? "", "role": "group" as const };
	return h("div", title === undefined ? attrs : { ...attrs, aria: { label: title } }, ...members);
};
