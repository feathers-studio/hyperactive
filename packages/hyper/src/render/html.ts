import { HyperComment, HyperHTMLStringNode, type HyperNodeish } from "../node.ts";
import { EmptyElements } from "../lib/emptyElements.ts";
import { ReadonlyState, State } from "../state.ts";
import { escapeAttr, escapeTextNode, isFalsy } from "../util.ts";
import type { Tag } from "../lib/tags.ts";
import type { Attributes } from "../attributes.ts";
import { List } from "../list.ts";
import * as Context from "../context.internal.ts";

function aria(attrs: Attributes<Tag>["aria"]) {
	if (!attrs) return "";

	return Object.entries(attrs)
		.map(([attr, v]) => {
			const key = `aria-${attr}`;
			let value = ReadonlyState.isState(v) ? v.value : v;
			// @ts-expect-error TODO: some aria properties will allow booleans in the future
			if (value === true) value = "";
			// `0` is a value: `aria-valuenow="0"` is a slider at its start, not one without a value.
			// `false` is not in the types, but a state may still hold one.
			if (value == null || value === "" || (value as unknown) === false) return "";
			// Escaped like every other attribute: a quote in a label used to end the attribute.
			return `${key}="${escapeAttr(String(value))}"`;
		})
		.join(" ");
}

function attrifyHTML(attrs: Attributes<Tag>): string {
	return Object.entries(attrs)
		.map(([k, v]) => {
			const attr = k as keyof Attributes<Tag>;

			if (attr === "on") return false;

			if (attr === "aria") {
				const value = attrs[attr];
				return aria(value);
			}

			if (attr === "init" || attr === "attach") return false;

			let value = v as Attributes<Tag>[typeof attr];
			if (ReadonlyState.isState(value)) value = value.value;

			// Behaviour, not markup: `ref` and other callbacks were written out as their source.
			if (typeof value === "function") return false;
			if (value === true) return attr;
			if (value === "") return attr;
			if (Array.isArray(value)) return `${attr}="${escapeAttr(value.filter(Boolean).join(" "))}"`;
			// Absent is null, undefined or false. `0` is a value: `tabindex="0"` makes an element
			// focusable, and dropping it left scrollable code blocks out of reach of the keyboard.
			if (value == null || value === false) return false;
			return `${attr}="${escapeAttr(String(value))}"`;
		})
		.filter(Boolean)
		.join(" ");
}

export interface Environment {
	registry: ReadonlyMap<symbol, Context.Provider<unknown>>;
}

const comment = "<!---->";

function toHTML(node: HyperNodeish, environment: Environment): string {
	if (node instanceof Context.Provider) {
		const registry = new Map(environment.registry);
		registry.set(node.contextId, node);
		return toHTML(node.contextualChild, { ...environment, registry });
	}

	if (node instanceof Context.Consumer) {
		const ctx = environment.registry.get(node.contextId);
		if (!ctx)
			throw new Error(
				`Requested context for (id: ${String(node.contextId).slice(
					7,
					-1,
				)}) not found. Was the Context Provider used?`,
			);
		return toHTML(node.renderWithContext(ctx.contextValue), environment);
	}

	if (node instanceof HyperHTMLStringNode) return node.htmlString;
	if (State.isState(node)) return renderHTML(node.value);
	if (List.isList(node)) return comment + node.toArray().map(renderHTML).join("") + comment;
	if (Array.isArray(node)) return comment + node.map(renderHTML).join("") + comment;

	if (typeof node === "string") return escapeTextNode(node);
	if (typeof node === "number" || typeof node === "bigint") return String(node);
	if (isFalsy(node)) return "";
	if (node instanceof HyperComment) return "<!-- " + node.text + " -->";

	let stringified = "<" + node.tag;

	const attr = attrifyHTML(node.attrs);

	if (attr) stringified += " " + attr;

	if (EmptyElements.has(node.tag as EmptyElements)) stringified += " />";
	else if (node.children.length)
		stringified +=
			">" + node.children.map(child => toHTML(child, environment)).join("") + `</${node.tag}>`;
	else stringified += `></${node.tag}>`;

	return stringified;
}

export function renderHTML(node: HyperNodeish): string {
	return toHTML(node, { registry: new Map() });
}
