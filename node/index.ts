import { Attrs } from "./types";
import { parseSelector } from "./parseSelector";
import { flatCat, isIterable, collect, map, isObject } from "./util";

interface Node {
	tag: string;
	key?: string;
	attrs: Attrs;
	children: Iterable<Node>;
}

type Nodes = Node | Iterable<Node>;

interface h {
	(element: string, selector: string, attr: Attrs, ...children: Nodes[]): Node;
	(element: string, selector: string, ...children: Nodes[]): Node;
	(selector: string, attr: Attrs, ...children: Nodes[]): Node;
	(selector: string, ...children: Nodes[]): Node;
	(attr: Attrs, ...children: Nodes[]): Node;
	(...children: Nodes[]): Node;
}

const composeAttributes = (a: Attrs, b: Attrs) => {
	if (a.id && b.id) {
		throw new Error(`Multiple IDs are not allowed: ${a.id}, ${b.id}`);
	}

	return Object.assign(a, b, { class: [...(a.class || []), ...(b.class || [])] });
};

const resolveChildren = <T>(a: Nodes[], b: T | Nodes): Iterable<Node> => {
	if (b instanceof Node) {
		return flatCat(...a, [b]);
	} else if (isIterable(b)) {
		return flatCat(...a, b);
	} else return flatCat(...a);
};

export const isNode = (x: any): x is Node => x instanceof Node;

export const isAttr = (x: any): x is Attrs => isObject(x) && !isIterable(x) && !isNode(x);

class Node implements Node {
	constructor(a?: unknown, b?: unknown, c?: unknown, ...otherChildren: Nodes[]) {
		if (typeof b === "string") {
			// (string, string, ...) -> Node;

			// if c is an object, but not an instance of Node or Array, it's attrs
			const attrs: Attrs = isAttr(c) ? <Attrs>c : {};
			// if c is an instance of Node or Array, it joins otherChildren
			const children = resolveChildren(otherChildren, <Node>c);
			const { tag, ...classID } = parseSelector(b);
			Object.assign(this, {
				tag: a,
				attrs: composeAttributes(classID, attrs),
				children,
			});
		} else if (typeof a === "string") {
			// at least a is defined
			// if b is an object, but not an instance of Node or Array, it's attrs
			const attrs: Attrs = isAttr(b) ? <Attrs>b : {};
			// if c or b are instances of Node or Array, it joins otherChildren
			const children = resolveChildren(otherChildren, [<Nodes>c, <Nodes>b]);
			const { tag, ...classID } = parseSelector(a, { tagMode: true });
			if (Array.isArray(c)) {
				Object.assign(this, {
					tag,
					attrs: composeAttributes(classID, attrs),
					children,
				});
			} else if (c instanceof Node) {
			}
		}
	}

	toJSON(): any {
		return Object.assign({}, this, {
			children: collect(this.children ? map(child => child.toJSON(), this.children) : []),
		});
	}
}

// export function h(a: string, b: string, c: Attrs, ...otherChildren: Nodes[]): Node {
// 	let node: Node = Object.create(Node);

// 	if (typeof b === "string") {
// 		return Object.assign(node, {
// 			tag: a,
// 			attrs: Object.assign(parseSelector(b), c),
// 			children: otherChildren,
// 			NODE,
// 		});
// 	} else if (typeof a === "string") {
// 		const { tag, ...attrs } = parseSelector(a, { tagMode: true });
// 		if ()
// 		return { tag, attrs, NODE };
// 	}

// 	return node;
// }

console.log(
	new Node(
		"div",
		"#main.container",
		{ "data-attr": "0" },
		new Node(".child", { "data-attr": "1" }),
	).toJSON(),
	new Node(".child", { "data-attr": "1" }),
);
