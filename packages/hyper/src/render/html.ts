import { HyperHTMLStringNode, type HyperNodeish } from "../node.ts";
import { EmptyElements } from "../lib/emptyElements.ts";
import { ReadonlyState, State } from "../state.ts";
import { escapeAttr, escapeTextNode, isFalsy } from "../util.ts";
import type { Tag } from "../lib/tags.ts";
import type { Attributes } from "../attributes.ts";
import { List } from "../list.ts";

function eventListeners(attrs: Attributes<Tag>["on"]) {
	// noop
	return false;
}

function aria(attrs: Attributes<Tag>["aria"]) {
	if (!attrs) return "";

	return Object.entries(attrs)
		.map(([attr, v]) => {
			const key = `aria-${attr}`;
			let value = ReadonlyState.isState(v) ? v.value : v;
			// @ts-expect-error TODO: some aria properties will allow booleans in the future
			if (value === true) value = "";
			if (!value) return "";
			return `${key}="${value}"`;
		})
		.join(" ");
}

function attrifyHTML(attrs: Attributes<Tag>): string {
	return Object.entries(attrs)
		.map(([k, v]) => {
			const attr = k as keyof Attributes<Tag>;

			if (attr === "on") return eventListeners(attrs[attr]);

			if (attr === "aria") {
				const value = attrs[attr];
				return aria(value);
			}

			if (attr === "ref") return false;

			let value = v as Attributes<Tag>[typeof attr];
			if (ReadonlyState.isState(value)) value = value.value;

			if (value === true) return attr;
			if (value === "") return attr;
			if (Array.isArray(value)) return `${attr}="${escapeAttr(value.filter(Boolean).join(" "))}"`;
			if (value) return `${attr}="${escapeAttr(String(value))}"`;
		})
		.filter(Boolean)
		.join(" ");
}

export function renderHTML(node: HyperNodeish): string {
	if (isFalsy(node)) return "";
	if (typeof node === "string") return escapeTextNode(node);
	if (node instanceof HyperHTMLStringNode) return node.htmlString;
	if (State.isState(node)) return renderHTML(node.value);
	if (List.isList(node)) return node.toArray().map(renderHTML).join("");

	let stringified = "<" + node.tag;

	const attr = attrifyHTML(node.attrs);

	if (attr) stringified += " " + attr;

	if (EmptyElements.has(node.tag as EmptyElements)) stringified += " />";
	else if (node.children.length) stringified += ">" + node.children.map(renderHTML).join("") + `</${node.tag}>`;
	else stringified += `></${node.tag}>`;

	return stringified;
}
