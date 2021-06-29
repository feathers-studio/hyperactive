///<reference path="https://raw.githubusercontent.com/denoland/deno/main/cli/dts/lib.deno.ns.d.ts" />
///<reference path="https://raw.githubusercontent.com/microsoft/TypeScript/main/lib/lib.dom.d.ts" />

import { Node, Nodeish, HTMLNode } from "./node.ts";
import { Attr } from "./attributes.ts";
import { isState } from "./state.ts";
import { Falsy, isFalsy, escapeHTML, guessEnv } from "./util.ts";

function attrifyHTML(
	attrs: Record<string, string | Record<string, string>>,
	prefix = "",
): string {
	return Object.entries(attrs)
		.map(([attr, value]) => {
			if (value === "") return value;
			if (typeof value === "object")
				return attrifyHTML(value, attr + "-");
			return `${prefix + attr}="${value}"`;
		})
		.join(" ");
}

export function renderHTML(node: Nodeish): string {
	if (isFalsy(node)) return "";
	if (typeof node === "string") return escapeHTML(node);
	if (node instanceof HTMLNode) return node.htmlString;
	if (isState(node)) return renderHTML(node.init);

	let stringified = "<" + node.tag;

	const attr = attrifyHTML(node.attrs);

	if (attr) stringified += " " + attr;

	if (node.children.length)
		stringified +=
			">" + node.children.map(renderHTML).join("") + `</${node.tag}>`;
	else stringified += " />";

	return stringified;
}

type NodeishtoDOM<N extends Nodeish> = N extends Falsy
	? ""
	: N extends string
	? ChildNode | ""
	: N extends HTMLNode
	? ChildNode | ""
	: HTMLElement;

function htmlStringToElement(html: string) {
	var template = document.createElement("template");
	html = html.trim(); // Never return a text node of whitespace as the result
	template.innerHTML = html;

	return template.content.firstChild || "";
}

function attrifyDOM(
	el: HTMLElement,
	attrs: Record<string, string | Record<string, string>>,
	prefix = "",
) {
	for (const attr in attrs) {
		const value = attrs[attr as keyof Attr];
		if (value === "") el.setAttribute(prefix + attr, "");
		else if (typeof value === "object") attrifyDOM(el, value, attr + "-");
		else if (value) el.setAttribute(prefix + attr, value);
	}
}

const toDOM = function toDOM<N extends Nodeish>(
	node: N,
	parent: HTMLElement,
	opts: { emptyTextNodes?: boolean } = {},
): "" | ChildNode | HTMLElement {
	if (typeof node === "string" && (node !== "" || opts.emptyTextNodes))
		return document.createTextNode(escapeHTML(node));
	if (isFalsy(node)) return "";
	if (node instanceof HTMLNode) return htmlStringToElement(node.htmlString);
	if (isState(node)) {
		let stateNode = toDOM(node.init, parent, { emptyTextNodes: true });

		node.subscribe(val => {
			const newStateNode = toDOM(val, parent, { emptyTextNodes: true });

			if (newStateNode === "" || stateNode === "") {
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
		if (childNode === "") {
			//
		} else el.append(childNode);
	}

	return el;
} as <N extends Nodeish>(node: N, parent: HTMLElement) => NodeishtoDOM<N>;

export function renderDOM<
	HyNode extends Node | string,
	RootNode extends HTMLElement,
>(rootNode: RootNode, hyNode: HyNode) {
	const env = guessEnv();
	if (env !== "browser")
		throw new Error(
			`renderDOM is meant to be used in the browser.` +
				` Found: '${env || "unknown"}'`,
		);

	return rootNode.append(toDOM(hyNode, rootNode));
}
