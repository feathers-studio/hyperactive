import { HyperHTMLStringNode, HyperNodeish } from "../node.ts";
import { EmptyElements } from "../lib/emptyElements.ts";
import { State } from "../state.ts";
import { escapeAttr, escapeTextNode, type Falsy, isFalsy } from "../util.ts";

// deno-lint-ignore no-explicit-any
type AnyFunction = (...props: any[]) => void;

type AttributePrimitive = string | number | boolean | AnyFunction | Falsy;
type AttributeValue = AttributePrimitive | (string | Falsy)[] | Record<string, AttributePrimitive>;
type AttributeObject = Record<string, AttributeValue>;

function attrifyHTML(attrs: AttributeObject, prefix = ""): string {
	return Object.entries(attrs)
		.map(([attr, value]) => {
			if (attr === "on" || typeof value === "function") return "";
			if (!value) return "";
			if (Array.isArray(value)) return attrifyHTML({ [attr]: value.filter(x => x).join(" ") }, prefix);
			if (typeof value === "object") return attrifyHTML(value, attr + "-");
			if (typeof value === "boolean")
				if (value) return `${prefix + attr}`;
				else return "";
			if (value) return `${prefix + attr}="${escapeAttr(String(value))}"`;
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
