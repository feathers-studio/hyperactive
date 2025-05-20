// TODO: cleanup listeners when nodes are removed from DOM
// TODO: support fragments

import type { Attributes } from "../attributes.ts";
import * as Context from "../context.internal.ts";
import { guessEnv } from "../guessEnv.ts";
import { LifecycleCallbacks, TagToHTMLElement } from "../lib/attributes.ts";
import { domGlobal } from "../lib/dom.extra.ts";
import type {
	Document,
	Element,
	HTMLElement,
	SVGElement,
	MathMLElement,
	Node,
	Text,
	Range,
	ChildNode,
} from "../lib/dom.ts";
import type { Tag } from "../lib/tags.ts";
import { List } from "../list.ts";
import { HyperComment, HyperHTMLStringNode, HyperNode, type HyperNodeish } from "../node.ts";
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

function attrifyDOM(el: Element, attrs: Attributes<Tag>): LifecycleCallbacks<Tag> {
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

	const lifecycles: LifecycleCallbacks<Tag> = {};

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

			if (key === "init" || key === "attach") {
				if (typeof value === "function") {
					lifecycles.init = value;
				}
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

	return lifecycles;
}

declare const SVGElement: {
	prototype: SVGElement;
	new (): SVGElement;
};

declare const MathMLElement: {
	prototype: MathMLElement;
	new (): MathMLElement;
};

declare const Range: {
	prototype: Range;
	new (): Range;
};

const listeners = new WeakMap<
	Element,
	{
		remove?: ReturnType<NonNullable<LifecycleCallbacks<Tag>["init"]>>;
		detach?: ReturnType<NonNullable<LifecycleCallbacks<Tag>["attach"]>>;
	}
>();

export class HyperRange {
	first: Node | null;
	last: Node | null;
	/** The logical parent of the range, which is either a HyperRange or a Node */
	parent: Node | HyperRange;
	/** The real DOM node that the range is a child of */
	container: Node;
	constructor(parent: Node | HyperRange) {
		this.parent = parent;
		const container = parent instanceof HyperRange ? parent.container : parent;
		this.container = container;

		const document = this.container.ownerDocument ?? (this.container as Document);

		// boundaries for the range
		this.first = document.createComment("");
		this.last = document.createComment("");
		this.container.appendChild(this.first);
		this.container.appendChild(this.last);
	}
	assertAlive(): asserts this is this & { first: Node; last: Node } {
		if (!this.first || !this.last) throw new Error("Range was destroyed");
	}
	reset() {
		this.assertAlive();
		let removing: ChildNode | null;
		while ((removing = this.first.nextSibling)) {
			if (removing === this.last) break;
			// we could simply call this.parent.removeChild(removing) and recurse
			// but this saves a few stack frames
			this.container.removeChild(removing);
		}
	}
	/** Removes the range and all its contents */
	destroy() {
		let removing: Node | null = this.first;
		while (removing) {
			const next = removing.nextSibling;
			this.container.removeChild(removing);
			if (removing === this.last) break;
			removing = next;
		}
		this.first = this.last = null;
	}
	insertBefore(node: Node) {
		this.container.insertBefore(node, this.first);
	}
	appendChild(node: Node | HyperRange) {
		if (node instanceof HyperRange) {
			let current = node.first;
			while (current) {
				this.container.insertBefore(current, this.last);
				if (current === node.last) break;
				current = current.nextSibling;
			}
		} else {
			this.container.insertBefore(node, this.last);
		}
	}
	replaceChild(node: Node, replacing: Node) {
		this.container.replaceChild(node, replacing);
	}
	removeChild(node: Node | HyperRange) {
		if (node instanceof HyperRange) {
			node.destroy();
		} else {
			this.container.removeChild(node);
		}
	}
}

function dom_op(env: RenderEnvironment, node: Node) {
	if (env.replacing) {
		if (env.replacing instanceof HyperRange) {
			env.replacing.insertBefore(node);
			env.replacing.destroy();
		} else env.parent.replaceChild(node, env.replacing);
		return node;
	}

	env.parent.appendChild(node);
	return node;
}

export interface RenderEnvironment {
	registry: ReadonlyMap<symbol, Context.Provider<unknown>>;
	namespace: string | null;
	document: Document;
	parent: Node | HyperRange;
	replacing: Node | HyperRange | null;
}

// TODO: listeners
function h_to_dom(node: HyperNodeish, environment: RenderEnvironment): Node | HyperRange {
	const document = environment.document;
	const parent = environment.parent;
	const comment = (text: string = "") => document.createComment(text);

	if (node instanceof Context.Provider) {
		const registry = new Map(environment.registry);
		registry.set(node.contextId, node);
		return h_to_dom(node.contextualChild, { ...environment, registry });
	}

	if (node instanceof Context.Consumer) {
		const ctx = environment.registry.get(node.contextId);
		if (!ctx)
			throw new Error(
				`Requested context for (id: ${String(node.contextId).slice(
					7,
					-1,
				)}) not found. Was the Context Provider used?`,
			);
		return h_to_dom(node.renderWithContext(ctx.contextValue), environment);
	}

	if (ReadonlyState.isState(node)) {
		let initial = h_to_dom(node.value, environment);
		node.listen(val => (initial = h_to_dom(val, { ...environment, replacing: initial })));
		return initial;
	}

	if (List.isList(node)) {
		const range = new HyperRange(parent);

		let old_nodes = new Map(
			// TODO: Map key should be the result of keyFor(data),
			// which defaults to data, but is preserved through mapping
			node.toArray().map(child => [child, h_to_dom(child, { ...environment, parent: range })]),
		);

		node.listen(change => {
			const list = change.list.toArray() as HyperNodeish[];
			const new_nodes = new Map<HyperNodeish, HyperRange | Node>();

			const focused = document.activeElement;

			for (let i = 0; i < list.length; i++) {
				const new_data = list[i];
				const old_node = old_nodes.get(new_data);

				if (old_node) {
					// reusing existing node

					// TODO: maybe update existing node with new data?
					// Or we leave it up to the user to control updates with State
					new_nodes.set(new_data, old_node);
					old_nodes.delete(new_data);
				} else {
					// creating new node

					// TODO: this should return a detached node, maybe rethink replacing logic
					// This currently works by accident because the new node gets appended to parent
					// and then yanked to its correct place
					const newNode = h_to_dom(new_data, { ...environment, parent: range });
					new_nodes.set(new_data, newNode);
				}
			}

			// remove stale nodes
			for (const node of old_nodes.values()) range.removeChild(node);

			// append all nodes in order
			for (const node of new_nodes.values()) range.appendChild(node);

			// TODO: Investigate if this is the best way to handle focus
			if (focused) (focused as HTMLElement).focus();

			old_nodes = new_nodes;
		});

		return range;
	}

	if (Array.isArray(node)) {
		const range = new HyperRange(parent);
		node.forEach(child => h_to_dom(child, { ...environment, parent: range }));
		return range;
	}

	// --- HyperChild ---

	if (typeof node === "string") return dom_op(environment, document.createTextNode(node));

	// Only do falsy check for non-strings because TextNodes are always to be rendered
	if (isFalsy(node)) return dom_op(environment, comment());

	if (node instanceof HyperHTMLStringNode) {
		// Create a temporary container with the same namespace as the parent
		let temp: Element;
		const parentNS = parent && "namespaceURI" in parent ? parent.namespaceURI : null;
		if (parentNS === ns.svg) temp = document.createElementNS(ns.svg, "g");
		else if (parentNS === ns.mathml) temp = document.createElementNS(ns.mathml, "mrow");
		else temp = document.createElement("div");

		temp.innerHTML = node.htmlString;

		// If no content was parsed, return a comment node
		if (!temp.firstChild) return dom_op(environment, comment());

		// If there's only one child, return it directly
		if (!temp.firstChild.nextSibling) return dom_op(environment, temp.firstChild);

		// TODO: avoid returning a DocumentFragment

		// If there are multiple children, create a DocumentFragment
		const fragment = document.createDocumentFragment();
		while (temp.firstChild) fragment.appendChild(temp.firstChild);

		return dom_op(environment, fragment);
	}

	if (node instanceof HyperComment) return dom_op(environment, comment(node.text));

	if (!("tag" in node)) throw new Error("Invalid node type: " + JSON.stringify(node));

	let namespace = environment.namespace;
	if (node.tag === "svg") namespace = ns.svg;
	if (node.tag === "math") namespace = ns.mathml;

	const element: Element = namespace
		? environment.document.createElementNS(namespace, node.tag)
		: environment.document.createElement(node.tag);

	// children should be rendered in the parent's namespace except for foreignObject
	if (node.tag === "foreignObject") namespace = null;
	// TODO: consider <annotation-xml> under MathML, this needs reading the encoding attribute

	const { init, attach } = attrifyDOM(element, node.attrs);

	const remove = init?.(element as TagToHTMLElement<Tag>);

	for (const child of node.children) {
		h_to_dom(child, {
			...environment,
			parent: element,
			namespace,
		});
	}

	dom_op(environment, element);

	const detach = attach?.(element as TagToHTMLElement<Tag>);
	listeners.set(element, { remove, detach });

	return element;
}

/*
function toDOM(node: HyperNodeish, environment: RenderEnvironment): Node[] {
	const document = environment.document;
	const parent = environment.parent;
	const comment = (text: string = "") => document.createComment(text);

	const listMemberTo1 = (nodes: Node[]): Node => {
		// TODO: replace this if we add support for ragments
		if (nodes.length > 1)
			throw new Error("Hyperactive cannot render list members with multiple children");
		if (nodes.length === 0) return comment();
		return nodes[0];
	};

	if (node instanceof Context.Provider) {
		const registry = new Map(environment.registry);
		registry.set(node.contextId, node);
		return toDOM(node.contextualChild, { ...environment, registry });
	}

	if (node instanceof Context.Consumer) {
		const ctx = environment.registry.get(node.contextId);
		if (!ctx)
			throw new Error(
				`Requested context for (id: ${String(node.contextId).slice(
					7,
					-1,
				)}) not found. Was the Context Provider used?`,
			);
		return toDOM(node.renderWithContext(ctx.contextValue), environment);
	}

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
**/

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
		document?: Document;
	};
};

export function renderDOM(rootNode: HTMLElement, hyperNode: HyperNodeish, opts: Opts = {}) {
	const document = opts.environment?.document ?? domGlobal.document;
	if (!document) throw new DOMNotFound();

	clear(rootNode);

	h_to_dom(hyperNode, {
		document,
		namespace: null,
		parent: rootNode,
		registry: new Map(),
		replacing: null,
	});
}
