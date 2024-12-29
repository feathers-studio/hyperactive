import { guessEnv } from "../guessEnv.ts";
import { Falsy, Flip, isFalsy } from "../util.ts";
import { State, type ReadonlyState } from "../state.ts";
import { HyperHTMLStringNode, type HyperNodeish } from "../node.ts";
import type { Document, HTMLElement, Element, SVGElement, Node, Text } from "../lib/dom.ts";
import type { Tag } from "../lib/tags.ts";
import type { Attributes } from "../lib/attributes.ts";

declare const document: Document;
declare const SVGElement: {
	prototype: SVGElement;
	new (): SVGElement;
};

/** @source https://www.w3.org/TR/2011/WD-html5-20110525/namespaces.html */
const ns = {
	html: "http://www.w3.org/1999/xhtml",
	mathml: "http://www.w3.org/1998/Math/MathML",
	svg: "http://www.w3.org/2000/svg",
	xlink: "http://www.w3.org/1999/xlink",
	xml: "http://www.w3.org/XML/1998/namespace",
	xmlns: "http://www.w3.org/2000/xmlns/",
} as const;

const reverseNs = Object.fromEntries(Object.entries(ns).map(([key, uri]) => [uri, key])) as Flip<typeof ns>;

export type NodeToDOM<N extends HyperNodeish> = N extends Falsy
	? null
	: N extends string
	? Text
	: N extends ReadonlyState<string>
	? Text
	: Element;

function htmlStringToElement(html: string): Node | null {
	const template = document.createElement("template");
	template.innerHTML = html;
	// TODO: we should probably do more here
	return template.content.firstElementChild;
}

function eventListeners(el: Element, listeners: Attributes<Tag>["on"]) {
	for (const key in listeners) {
		const type = key as keyof typeof listeners;
		const value = listeners[type];
		// @ts-expect-error value needs better typing
		if (typeof value === "function") el.addEventListener(type, value);
	}
}

function ariaAttr(el: Element, aria: Attributes<Tag>["aria"]) {
	for (const member in aria) {
		const value = aria[member as keyof typeof aria];
		if (typeof value === "boolean") {
			if (value) el.setAttribute("aria-" + member, "");
		} else if (value) el.setAttribute("aria-" + member, value);
	}
}

function attrifyDOM(el: Element, attrs: Attributes<Tag>, namespace: (typeof ns)[keyof typeof ns]) {
	const set = (key: string, value: string) =>
		namespace === ns.html ? el.setAttribute(key, value) : el.setAttributeNS(namespace, key, value);

	for (const attr in attrs) {
		const key = attr as keyof typeof attrs;
		const value = attrs[key];
		if (!value) return;
		else if (typeof value === "boolean") {
			if (value) set(key, "");
		} else if (key === "ref" && typeof value === "function") value(el as HTMLElement);
		else if (Array.isArray(value)) set(key, value.filter(x => x).join(" "));
		else if (key === "aria") ariaAttr(el, attrs[key]);
		else if (key === "on") eventListeners(el, attrs[key]);
		else if (value) set(key, String(value));
	}
}

function toDOM(parent: Element, node: HyperNodeish): Node | null {
	if (typeof node === "string") {
		const el = document.createTextNode(node);
		if (el) parent.append(el);
		return el;
	}

	if (isFalsy(node)) return null;

	if (node instanceof HyperHTMLStringNode) {
		const el = htmlStringToElement(node.htmlString);
		if (el) parent.append(el);
		return el;
	}

	if (State.isState(node)) {
		let init = toDOM(parent, node.value);

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

		if (init) parent.append(init);
		return init;
	}

	const namespace = ns[node.tag as keyof typeof ns] ?? ns.html;
	const el = namespace ? document.createElementNS(namespace, node.tag) : document.createElement(node.tag);
	attrifyDOM(el, node.attrs, namespace);

	for (const child of node.children) {
		const childNode = toDOM(el, child);
		if (childNode === null) {
			//
		} else el.append(childNode);
	}

	parent.append(el);

	return el;
}

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
	toDOM(rootNode, hyperNode);
}
