import { Nodeish, HTMLNode } from "./node.ts";
import { EmptyElements } from "./lib/emptyElements.ts";
import { isState } from "./state.ts";
import { isFalsy, escapeAttr, escapeTextNode } from "./util.ts";

// deno-lint-ignore no-explicit-any
type AnyFunction = (...props: any[]) => void;

type AttributeObject = Record<
	string,
	| string
	| number
	| boolean
	| AnyFunction
	| Record<string, string | number | boolean | AnyFunction>
>;

function attrifyHTML(attrs: AttributeObject, prefix = ""): string {
	return Object.entries(attrs)
		.map(([attr, value]) => {
			if (attr === "on" || typeof value === "function") return "";
			if (value === "") return value;
			if (typeof value === "object")
				return attrifyHTML(value, attr + "-");
			if (typeof value === "boolean")
				if (value) return `${prefix + attr}`;
				else return "";
			if (value) return `${prefix + attr}="${escapeAttr(String(value))}"`;
		})
		.join(" ");
}

export function renderHTML(node: Nodeish): string {
	if (isFalsy(node)) return "";
	if (typeof node === "string") return escapeTextNode(node);
	if (node instanceof HTMLNode) return node.htmlString;
	if (isState(node)) return renderHTML(node.init);

	let stringified = "<" + node.tag;

	const attr = attrifyHTML(node.attrs);

	if (attr) stringified += " " + attr;

	if (EmptyElements.has(node.tag as EmptyElements)) stringified += " />";
	else if (node.children.length)
		stringified +=
			">" + node.children.map(renderHTML).join("") + `</${node.tag}>`;
	else stringified += `></${node.tag}>`;

	return stringified;
}
