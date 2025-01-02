import type { Attributes } from "../lib/attributes.ts";
import type { Document, Element, HTMLElement, Node, Text } from "../lib/dom.ts";
import type { Tag } from "../lib/tags.ts";
import { guessEnv } from "../guessEnv.ts";
import { List, ListEventKind } from "../list.ts";
import { HyperHTMLStringNode, type HyperNodeish } from "../node.ts";
import { ReadonlyState } from "../state.ts";
import { Falsy, isFalsy } from "../util.ts";

/** @source https://www.w3.org/TR/2011/WD-html5-20110525/namespaces.html */
const ns = {
	html: "http://www.w3.org/1999/xhtml",
	mathml: "http://www.w3.org/1998/Math/MathML",
	svg: "http://www.w3.org/2000/svg",
	xlink: "http://www.w3.org/1999/xlink",
	xml: "http://www.w3.org/XML/1998/namespace",
	xmlns: "http://www.w3.org/2000/xmlns/",
} as const;

export type NodeToDOM<N extends HyperNodeish> = N extends Falsy
	? null
	: N extends string
	? Text
	: N extends ReadonlyState<string>
	? Text
	: Element;

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

function attrifyDOM(el: Element, attrs: Attributes<Tag>) {
	const set = (key: string, value: string) => el.setAttribute(key, value);

	Object.entries(attrs)
		.filter(([_, value]) => value != undefined)
		.map(([k, v]) => {
			const key = k as keyof typeof attrs;

			if (key === "on") return eventListeners(el, attrs[key]);
			if (key === "aria") return ariaAttr(el, attrs[key]);

			const value = v as Attributes<Tag>[typeof key];

			if (key === "ref") {
				if (typeof value === "function") return value(el as HTMLElement);
				else return;
			}

			if (value === true) return set(key, "");
			if (value === "") return set(key, "");
			if (Array.isArray(value)) return set(key, value.filter(x => x).join(" "));
			if (value) return set(key, String(value));
		});
}

function toDOM(parent: Element, node: HyperNodeish, environment: { document: Document }): Node | null {
	if (typeof node === "string") {
		const el = environment.document.createTextNode(node);
		if (el) parent.append(el);
		return el;
	}

	if (isFalsy(node)) return null;

	if (node instanceof HyperHTMLStringNode) {
		// TODO: investigate security implications of this
		parent.innerHTML = node.htmlString;
		return parent.lastElementChild;
	}

	if (ReadonlyState.isState(node)) {
		let init = toDOM(parent, node.value, environment);

		node.listen(val => {
			const update = toDOM(parent, val, environment);

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

	if (List.isList(node)) {
		// TODO: implement list state reactively
		for (const child of node) {
			const childNode = toDOM(parent, child, environment);
			if (childNode !== null) parent.append(childNode);
		}
		return parent.lastElementChild;
	}

	const namespace = ns[node.tag as keyof typeof ns] ?? ns.html;
	const el = namespace
		? environment.document.createElementNS(namespace, node.tag)
		: environment.document.createElement(node.tag);
	attrifyDOM(el, node.attrs);

	for (const child of node.children) {
		const childNode = toDOM(el, child, environment);
		if (childNode === null) {
			//
		} else el.append(childNode);
	}

	parent.append(el);

	return el;
}

class DOMNotFound extends Error {
	constructor() {
		super(
			[
				`A \`document\` object was not found in your global environment.`,
				`Found: '${guessEnv() || "unknown"}'.`,
				`To use a non-global environment, pass \`{ environment: { document: ... } }\` to renderDOM.`,
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
	environment?: {
		document: Document;
	};
};

export function renderDOM(rootNode: HTMLElement, hyperNode: HyperNodeish, { environment }: Opts = {}) {
	if (!environment || !environment.document) {
		if (!globalThis.document) throw new DOMNotFound();
		environment = { document: globalThis.document };
	}

	clear(rootNode);
	toDOM(rootNode, hyperNode, environment);
}
