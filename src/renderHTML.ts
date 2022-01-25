import { HyperNodeish, HyperHTMLStringNode } from "./node.ts";
import { EmptyElements } from "./lib/emptyElements.ts";
import { isState } from "./state.ts";
import { isFalsy, escapeAttr, escapeTextNode } from "./util.ts";

// deno-lint-ignore no-explicit-any
type AnyFunction = (...props: any[]) => void;

type AttributePrimitive = string | number | boolean | AnyFunction;
type AttributeValue = AttributePrimitive | Record<string, AttributePrimitive>;
type AttributeObject = Record<string, AttributeValue>;

function attrifyHTML(attrs: AttributeObject, prefix = ""): string {
	return Object.entries(attrs)
		.map(([attr, value]) => {
			if (attr === "on" || typeof value === "function") return "";
			if (value === "") return value;
			if (typeof value === "object") return attrifyHTML(value, attr + "-");
			if (typeof value === "boolean")
				if (value) return `${prefix + attr}`;
				else return "";
			if (value) return `${prefix + attr}="${escapeAttr(String(value))}"`;
		})
		.join(" ");
}

export function renderHTML(node: HyperNodeish): string {
	if (isFalsy(node)) return "";
	if (typeof node === "string") return escapeTextNode(node);
	if (node instanceof HyperHTMLStringNode) return node.htmlString;
	if (isState(node)) return renderHTML(node.init);

	let stringified = "<" + node.tag;

	const attr = attrifyHTML(node.attrs);

	if (attr) stringified += " " + attr;

	if (EmptyElements.has(node.tag as EmptyElements)) stringified += " />";
	else if (node.children.length) stringified += ">" + node.children.map(renderHTML).join("") + `</${node.tag}>`;
	else stringified += `></${node.tag}>`;

	return stringified;
}
