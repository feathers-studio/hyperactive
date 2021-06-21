import { Nodeish, HTMLNode } from "./Node.ts";
import { isFalsy, escapeHTML } from "./util.ts";

export function renderHTML(node: Nodeish) {
	if (isFalsy(node)) return "";
	if (typeof node === "string") return escapeHTML(node);
	if (node instanceof HTMLNode) return node.htmlString;

	let stringified = "<" + node.tag;

	const attr = Object.entries(node.attrs)
		.map(([attr, val]) => (val ? `${attr}="${val}"` : attr))
		.join(" ");

	if (attr) stringified += " " + attr;

	if (node.children.length)
		stringified +=
			">" + node.children.map(renderHTML).join("") + `</${node.tag}>`;
	else stringified += " />";

	return stringified;
}
