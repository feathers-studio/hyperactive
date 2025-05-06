// TODO: cleanup listeners when nodes are removed from DOM
// TODO: support fragments

import type { Attributes } from "../attributes.ts";
import type { Document, Element, HTMLElement, Node, Text } from "../lib/dom.ts";
import type { Tag } from "../lib/tags.ts";
import { guessEnv } from "../guessEnv.ts";
import { List, ListEventKind } from "../list.ts";
import { HyperHTMLStringNode, type HyperNodeish } from "../node.ts";
import { ReadonlyState } from "../state.ts";
import { Falsy, isFalsy, unreachable } from "../util.ts";

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

function attrifyDOM(el: Element, attrs: Attributes<Tag>) {
	const set = (key: string, value: unknown) => {
		if (value === true || value === "") return el.setAttribute(key, "");
		if (isFalsy(value)) return el.removeAttribute(key);
		if (Array.isArray(value)) return el.setAttribute(key, value.filter(x => x).join(" "));
		return el.setAttribute(key, String(value));
	};

	const setAria = (member: string, value: unknown) => {
		if (typeof value === "boolean") {
			if (value) el.setAttribute("aria-" + member, "");
			else el.removeAttribute("aria-" + member);
		} else if (value) el.setAttribute("aria-" + member, String(value));
		else el.removeAttribute("aria-" + member);
	};

	const handleAria = (aria: Attributes<Tag>["aria"]) => {
		if (!aria) return;

		for (const member in aria) {
			const value = aria[member as keyof typeof aria];
			if (ReadonlyState.isState(value)) {
				setAria(member, value.value);
				value.listen(v => setAria(member, v));
			} else setAria(member, value);
		}
	};

	Object.entries(attrs)
		.filter(([_, value]) => value != undefined)
		.map(([k, v]) => {
			const key = k as keyof typeof attrs;

			if (key === "on") return eventListeners(el, attrs[key]);

			if (key === "aria") {
				const value = attrs[key];
				if (ReadonlyState.isState(value)) {
					handleAria(value.value);
					return value.listen(v => handleAria(v));
				}
				return handleAria(value);
			}

			const value = v as Attributes<Tag>[typeof key];

			if (key === "ref") {
				if (typeof value === "function") return value(el as HTMLElement);
				else return;
			}

			if (ReadonlyState.isState(value)) {
				set(key, value.value);
				return value.listen(v => set(key, v));
			}

			if (List.isList(value)) {
				const joined = value.join(" ");
				set(key, joined.value);
				return joined.listen(v => set(key, v));
			}

			set(key, value);
		});
}

function toDOM(node: HyperNodeish, environment: { document: Document; parent: Element }): Node[] {
	const document = environment.document;
	const parent = environment.parent;
	const comment = (text: string = "") => document.createComment(text);

	const listMemberTo1 = (nodes: Node[]): Node => {
		// TODO: replace this if we add support for ragments
		if (nodes.length > 1) throw new Error("Hyperactive cannot render list members with multiple children");
		if (nodes.length === 0) return comment();
		return nodes[0];
	};

	if (typeof node === "string") return [document.createTextNode(node)];

	if (isFalsy(node)) return [comment()];

	if (node instanceof HyperHTMLStringNode) {
		// TODO: investigate security implications of this
		parent.innerHTML = node.htmlString;
		if (!parent.lastElementChild) return [comment()];

		// This has to be a non-empty array because we checked for parent.lastElementChild
		return [
			// @ts-expect-error TODO: We are not adopting lib.dom.iterable yet
			...(parent.childNodes as Node[]),
		];
	}

	if (ReadonlyState.isState(node)) {
		let initChildren = toDOM(node.value, environment);

		node.listen(val => {
			const update = toDOM(val, environment);

			// skip HyperHTMLStringNode because it gets replaced by innerHTML
			if (!(val instanceof HyperHTMLStringNode)) {
				for (let i = 0; i < initChildren.length; i++) {
					parent.replaceChild(update[i], initChildren[i]);
				}
			}

			// replace init for future updates
			initChildren = update;
		});

		return initChildren;
	}

	// TODO: implement list state reactively
	if (List.isList(node)) {
		const tracking: Node[] = [];

		for (const child of node) tracking.push(listMemberTo1(toDOM(child, environment)));

		node.listen(change => {
			switch (change.kind) {
				case ListEventKind.Append: {
					const toRender = listMemberTo1(toDOM(change.member.value, environment));
					parent.append(toRender);
					return tracking.push(toRender);
				}
				case ListEventKind.Prepend: {
					const toRender = listMemberTo1(toDOM(change.member.value, environment));
					parent.prepend(toRender);
					return tracking.unshift(toRender);
				}
				case ListEventKind.Insert: {
					const toRender = listMemberTo1(toDOM(change.member.value, environment));
					parent.insertBefore(toRender, tracking[change.index]);
					return tracking.splice(change.index, 0, toRender);
				}
				case ListEventKind.Remove: {
					const toRemove = tracking[change.index];
					parent.removeChild(toRemove);
					return tracking.splice(change.index, 1);
				}
				case ListEventKind.Replace: {
					const toRender = listMemberTo1(toDOM(change.member.value, environment));
					parent.replaceChild(toRender, tracking[change.index]);
					return tracking.splice(change.index, 1, toRender);
				}
				case ListEventKind.Swap: {
					const a = tracking[change.from];
					const b = tracking[change.to];

					// Same node or invalid indices - no action needed
					if (a === b) return;

					// Get the node that comes after b (might be null)
					const bNext = b.nextSibling;

					// Special case: if a and b are adjacent and b is after a
					if (bNext === a) {
						parent.insertBefore(b, a);
					}
					// All other cases
					else {
						parent.insertBefore(b, a); // Move b to a's position
						parent.insertBefore(a, bNext); // Move a to b's old position
					}

					tracking[change.from] = b;
					tracking[change.to] = a;
					return;
				}
				case ListEventKind.Move: {
					const toMove = tracking[change.from];
					const target = tracking[change.to];

					// Same position or same node - no action needed
					if (toMove === target || change.from === change.to) return;

					// Insert at the new position
					parent.insertBefore(toMove, target);

					// Update tracking array
					tracking.splice(change.from, 1); // Remove from old position
					tracking.splice(change.to, 0, toMove); // Insert at new position
					return;
				}
				case ListEventKind.Update: {
					clear(parent);
					tracking.splice(0);
					for (const child of node) {
						const toRender = listMemberTo1(toDOM(child, environment));
						parent.append(toRender);
						tracking.push(toRender);
					}
					return;
				}
				case ListEventKind.MemberUpdate: {
					// This should be handled by regular state updates
					return;
				}
				default:
					unreachable(change);
			}
		});

		return tracking;
	}

	const namespace = node.tag === "svg" ? ns.svg : node.tag === "math" ? ns.mathml : null;
	const el: Element = namespace
		? environment.document.createElementNS(namespace, node.tag)
		: environment.document.createElement(node.tag);
	attrifyDOM(el, node.attrs);

	for (const child of node.children) {
		el.append(...toDOM(child, { ...environment, parent: el }));
	}

	return [el];
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

function clear(node: Node) {
	let child;
	while ((child = node.firstChild)) node.removeChild(child);
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
	const nodes = toDOM(hyperNode, { ...environment, parent: rootNode });
	for (const node of nodes) rootNode.append(node);
}
