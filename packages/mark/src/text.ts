import type { Inline } from "./types.ts";

/** The text of inline nodes, as a heading's id, an image's alt text and a variant's name read it. */
export function text(nodes: readonly Inline[]): string {
	return nodes
		.map(node => {
			switch (node.type) {
				case "text":
				case "code":
					return node.content;
				case "emphasis":
				case "strong":
				case "strike":
				case "link":
					return text(node.content);
				// Neither is text in the rendered heading GitHub's ids are read from.
				case "image":
				case "footnote-reference":
					return "";
				case "interpolation":
					return node.toString();
			}
		})
		.join("");
}
