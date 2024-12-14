import { HyperHTMLStringNode, HyperNodeish } from "../node.ts";
import { EmptyElements } from "../lib/emptyElements.ts";
import { State } from "../state.ts";
import { escapeAttr, escapeTextNode, isFalsy } from "../util.ts";
import { Tag } from "../lib/tags.ts";
import { Attributes } from "../lib/attributes.ts";

function eventListeners(attrs: Attributes<Tag>["on"]) {
	// noop
	return false;
}

function aria(attrs: Attributes<Tag>["aria"]) {
	if (!attrs) return "";
	return (
		Object.entries(attrs)
			// @ts-expect-error aria properties will allow booleans in the future
			.map(([attr, value]) => (value ? `aria-${attr}="${value === true ? "" : value}"` : ""))
			.join(" ")
	);
}

function attrifyHTML(attrs: Attributes<Tag>): string {
	return Object.entries(attrs)
		.map(([k, v]) => {
			const attr = k as keyof Attributes<Tag>;

			if (attr === "on") return eventListeners(attrs[attr]);
			if (attr === "aria") return aria(attrs[attr]);
			if (attr === "ref") return false;

			const value = v as Attributes<Tag>[keyof Attributes<Tag>];

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

	let stringified = "<" + node.tag;

	const attr = attrifyHTML(node.attrs);

	if (attr) stringified += " " + attr;

	if (EmptyElements.has(node.tag as EmptyElements)) stringified += " />";
	else if (node.children.length) stringified += ">" + node.children.map(renderHTML).join("") + `</${node.tag}>`;
	else stringified += `></${node.tag}>`;

	return stringified;
}
