import { Nodeish, isFalsy } from "./Node.ts";

export function renderHTML(node: Nodeish) {
	if (typeof node === "string") return node;
	if (isFalsy(node)) return "";

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
