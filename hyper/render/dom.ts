import { guessEnv } from "../guessEnv.ts";
import { Falsy, isFalsy } from "../util.ts";
import { State, type ReadonlyState } from "../state.ts";
import { Document, HTMLElement, Node, Text } from "../lib/dom.ts";
import { HyperHTMLStringNode, HyperNodeish } from "../node.ts";
import { Tag } from "../lib/tags.ts";
import { Attributes } from "../lib/attributes.ts";

declare const document: Document;

type NodeToDOM<N extends HyperNodeish> = N extends Falsy
	? null
	: N extends string
	? Text
	: N extends ReadonlyState<string>
	? Text
	: HTMLElement;

function htmlStringToElement(html: string): Node | null {
	const template = document.createElement("template");
	template.innerHTML = html;
	return template.content.firstChild;
}

function eventListeners(el: HTMLElement, listeners: Attributes<Tag>["on"]) {
	for (const key in listeners) {
		const type = key as keyof typeof listeners;
		const value = listeners[type];
		// @ts-expect-error value needs better typing
		if (typeof value === "function") el.addEventListener(type, value);
	}
}

function ariaAttr(el: HTMLElement, aria: Attributes<Tag>["aria"]) {
	for (const member in aria) {
		const value = aria[member as keyof typeof aria];
		if (typeof value === "boolean") {
			if (value) el.setAttribute("aria-" + member, "");
		} else if (value) el.setAttribute("aria-" + member, value);
	}
}

function attrifyDOM(el: HTMLElement, attrs: Attributes<Tag>) {
	for (const attr in attrs) {
		const key = attr as keyof typeof attrs;
		const value = attrs[key];
		if (!value) return;
		else if (typeof value === "boolean") {
			if (value) el.setAttribute(key, "");
		} else if (key === "ref" && typeof value === "function") value(el);
		else if (Array.isArray(value)) el.setAttribute(key, value.filter(x => x).join(" "));
		else if (key === "aria") ariaAttr(el, attrs[key]);
		else if (key === "on") eventListeners(el, attrs[key]);
		else if (value) el.setAttribute(key, String(value));
	}
}

const toDOM = function toDOM(parent: HTMLElement, node: HyperNodeish): Node | null {
	if (typeof node === "string") return document.createTextNode(node);
	if (isFalsy(node)) return null;
	if (node instanceof HyperHTMLStringNode) return htmlStringToElement(node.htmlString);
	if (State.isState(node)) {
		let init = toDOM(parent, node.get());

		node.listen(val => {
			const update = toDOM(parent, val);

			if (update === null || init === null) {
				// no-op
			} else {
				parent.replaceChild(update, init);
				// replace init for future updates
				init = update;
			}
		});

		// return DOMNode for rendering
		return init;
	}

	const el = document.createElement(node.tag);

	attrifyDOM(el, node.attrs);

	for (const child of node.children) {
		const childNode = toDOM(el, child);
		if (childNode === null) {
			//
		} else el.append(childNode);
	}

	return el;
};

class DOMNotFound extends Error {
	constructor(env?: string) {
		super(
			[
				`renderDOM is meant to be used in the browser.`,
				`Found: '${env || "unknown"}'.`,
				`To force, pass \`{ skipEnvCheck: true }\` to renderDOM.`,
			].join(" "),
		);
	}
}

function clear(node: HTMLElement) {
	let child;

	while ((child = node.firstChild)) {
		node.removeChild(child);
	}
}

type Opts = {
	skipEnvCheck?: boolean;
};

export function renderDOM(rootNode: HTMLElement, hyperNode: HyperNodeish, { skipEnvCheck }: Opts = {}) {
	if (!skipEnvCheck) {
		const env = guessEnv();
		if (env !== "browser") throw new DOMNotFound(env);
	}

	clear(rootNode);
	const el = toDOM(rootNode, hyperNode);
	if (el) rootNode.append(el);
}
