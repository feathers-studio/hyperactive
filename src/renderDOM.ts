import { Node, Nodeish, HTMLNode } from "./node.ts";
import { Attr } from "./lib/attributes.ts";
import { isState } from "./state.ts";
import { Falsy, isFalsy } from "./util.ts";
import { guessEnv } from "./guessEnv.ts";
import { HTMLElement, Text, DOMNode, Document } from "./lib/dom.ts";

declare var document: Document;

// deno-lint-ignore no-explicit-any
type AnyFunction = (...props: any[]) => void;

type AttributeObject = Record<
	string,
	string | number | boolean | AnyFunction | Record<string, string | number | boolean | AnyFunction>
>;

type NodeishtoDOM<N extends Nodeish> = N extends Falsy ? null : N extends string ? Text : HTMLElement;

function htmlStringToElement(html: string): DOMNode | null {
	var template = document.createElement("template");
	html = html.trim(); // Never return a text node of whitespace as the result
	template.innerHTML = html;

	return template.content.firstChild;
}

function attrifyDOM(el: HTMLElement, attrs: AttributeObject, prefix = "") {
	for (const attr in attrs) {
		const value = attrs[attr as keyof Attr];
		if (value === "") el.setAttribute(prefix + attr, "");
		else if (attr === "ref" && typeof value === "function") value(el);
		else if (typeof value === "object") attrifyDOM(el, value, attr + "-");
		else if (typeof value === "boolean")
			if (value) el.setAttribute(prefix + attr, "");
			// no-op
			else null;
		else if (prefix === "on-" && typeof value === "function") el.addEventListener(attr, value);
		else if (value) el.setAttribute(prefix + attr, String(value));
	}
}

const toDOM = function toDOM<N extends Nodeish>(
	node: N,
	parent: HTMLElement,
	opts: { emptyTextNodes?: boolean } = {},
): DOMNode | null {
	if (typeof node === "string" && (node !== "" || opts.emptyTextNodes)) return document.createTextNode(node);
	if (isFalsy(node)) return null;
	if (node instanceof HTMLNode) return htmlStringToElement(node.htmlString);
	if (isState(node)) {
		let stateNode = toDOM(node.init, parent, { emptyTextNodes: true });

		node.subscribe(val => {
			const newStateNode = toDOM(val, parent, { emptyTextNodes: true });

			if (newStateNode === null || stateNode === null) {
				//
			} else {
				parent.replaceChild(newStateNode, stateNode);
				stateNode = newStateNode;
			}
			return newStateNode;
		});

		return stateNode;
	}

	const el = document.createElement(node.tag);

	attrifyDOM(el, node.attrs);

	for (const child of node.children) {
		const childNode = toDOM(child, el);
		if (childNode === null) {
			//
		} else el.append(childNode);
	}

	return el;
} as <N extends Nodeish>(node: N, parent: HTMLElement) => NodeishtoDOM<N>;

export function renderDOM<HyNode extends Node | string, RootNode extends HTMLElement>(
	rootNode: RootNode,
	hyNode: HyNode,
) {
	const env = guessEnv();
	if (env !== "browser")
		throw new Error(`renderDOM is meant to be used in the browser.` + ` Found: '${env || "unknown"}'`);

	return rootNode.append(toDOM(hyNode, rootNode));
}
