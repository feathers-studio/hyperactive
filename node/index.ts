import { parseSelector } from "./parseSelector";

type Node = {
	tag: string;
	key: string;
	attrs: string | null;
	children: Node[];
};

// type h = (element: string, selector: string, attr: object, ...children: Node[]) => Node;
// const h: h = (a, b, c, ...otherChildren) {

// 	return {
// 		tag,
// 		key,
// 		attrs,
// 		children,
// 	};
// };
