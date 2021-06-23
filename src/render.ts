///<reference path="https://raw.githubusercontent.com/denoland/deno/main/cli/dts/lib.deno.ns.d.ts" />
///<reference path="https://raw.githubusercontent.com/microsoft/TypeScript/main/lib/lib.dom.d.ts" />

import { Node, Nodeish, HTMLNode } from "./Node.ts";
import { Falsy, isFalsy, escapeHTML, guessEnv } from "./util.ts";

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

type NodeishtoDOM<N extends Nodeish> = N extends Falsy
	? ""
	: N extends string
	? string
	: N extends HTMLNode
	? { innerHTML: string }
	: HTMLElement;

const toDOM = function toDOM<N extends Nodeish>(node: N) {
	if (isFalsy(node)) return "";
	if (typeof node === "string") return escapeHTML(node);
	if (node instanceof HTMLNode) return { innerHTML: node.htmlString };

	const el = document.createElement(node.tag);

	for (const attr in node.attrs) {
		el.setAttribute(attr, node.attrs[attr]);
	}

	for (const child of node.children) {
		const childNode = toDOM(child);
		if (typeof childNode !== "string" && "innerHTML" in childNode)
			el.insertAdjacentHTML("beforeend", childNode.innerHTML);
		else el.append(childNode);
	}

	return el;
} as <N extends Nodeish>(node: N) => NodeishtoDOM<N>;

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

	const domNode = toDOM(hyNode);
	return rootNode.append(domNode);
}
