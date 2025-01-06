export type Value =
	// primitives
	| string
	| number
	| boolean
	| null
	// arrays
	| Value[]
	// objects
	| { [key: string]: Value };

/*
	meta is simply a special call that can only appear at the top of the document.
*/
export class Meta {
	type: "meta" = "meta";
	constructor(public parameters: Block.Parameters) {}
}

export namespace Block {
	export class Parameter {
		type: "parameter" = "parameter";
		constructor(public name: string, public value: Value | Call) {}
		toString(): string {
			if (this.name === "__default") return JSON.stringify(this.value);
			const value = JSON.stringify(this.value);
			return `${this.name}: ${value}`;
		}
	}

	export class Parameters {
		type: "parameters" = "parameters";
		constructor(public parameters: Parameter[]) {}
		toString(): string {
			return this.parameters.map(p => p.toString()).join(", ");
		}
	}

	/*
			Define extensions as a call to a function.
			Example:

			=figure(
				src: "https://example.com/image.jpg",
				caption: "An example image"
			)
		*/
	export class Call {
		type: "call" = "call";
		constructor(public name: string, public parameters: Parameters) {}
		toString(): string {
			return `=${this.name}(${this.parameters.toString()})`;
		}
	}

	export class Decorator {
		type: "decorator" = "decorator";
		constructor(public name: string, public parameters: Block.Parameters, public blocks: Block[]) {}
		toString(): string {
			const needs_markers = this.blocks.length === 0 || this.blocks.length > 1;

			let result = `@${this.name}`;
			if (this.parameters.parameters.length > 0) {
				result += `(${this.parameters.toString()})`;
			}
			if (needs_markers) result += ">";
			if (this.blocks.length > 0) result += "\n" + this.blocks.map(b => b.toString()).join("\n");
			if (needs_markers) result += "\n<@";
			return result;
		}
	}

	/*
		Single-line comments only.
		Example:

		-- comment
	 */
	export class Comment {
		type: "comment" = "comment";
		constructor(public content: string) {}
		toString(): string {
			return `-- ${this.content}`;
		}
	}

	/*
		Paragraphs are blocks of text.
		Example:

		Paragraph
	*/
	export class Paragraph {
		type: "paragraph" = "paragraph";
		constructor(public content: Inline[]) {}
		toString(): string {
			return this.content.map(c => c.toString()).join("");
		}
	}

	export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

	/*
		Headings are blocks of text.
		Example:

		# Heading
		## Subheading
	*/
	export class Heading {
		type: "heading" = "heading";
		constructor(public level: HeadingLevel, public content: Inline[]) {}
		toString(): string {
			return `${"#".repeat(this.level)} ${this.content.map(c => c.toString()).join("")}`;
		}
	}

	/*
		Lists are blocks of text.
		Example:

		- Item
		- Item
		- Item

		Ordered lists use numbers.
		Example:

		1. Item
		2. Item
		3. Item

		Task lists use checkboxes:
		Example:

		- [ ] Item
		- [x] Item
		- [ ] Item

		Nested lists are supported.
		Example:

		* Item
			* Subitem
			* Subitem
		* Item
	 */
	export class List {
		type: "list" = "list";
		constructor(public ordered: boolean, public items: (ListItem | TaskItem)[]) {}
		toString(): string {
			return `${this.ordered ? "1." : "-"} ${this.items.map(i => i.toString()).join("\n")}`;
		}
	}

	/*
		List items are blocks of text.
		Example:

		* Item
		* Item
		* Item
	 */
	export class ListItem {
		type: "list-item" = "list-item";
		constructor(public content: Block[]) {}
		toString(): string {
			// TODO: add indentation
			return this.content.map(c => c.toString()).join("\n");
		}
	}

	/*
		Task items are list items with a checkbox.
		Example:

		* [ ] Item
		* [x] Item
		* [ ] Item
	 */
	export class TaskItem {
		type: "task-item" = "task-item";
		constructor(public content: Block[], public checked: boolean) {}
		toString(): string {
			return `- [${this.checked ? "x" : " "}] ${this.content.map(c => c.toString()).join("\n")}`;
		}
	}

	export type HighlightRange = { start: number; end: number };

	export interface CodeBlockOptions {
		language?: string;
		title?: string;
		lineNumbers?: boolean;
		highlight?: HighlightRange[];
		end?: string;
	}

	/*
		Code blocks are blocks of code.
		Example:

		```language Title :line-numbers :highlight=1-3,4-5 :end=END
		content
		``` END
	 */
	export class CodeBlock {
		type: "code-block" = "code-block";
		constructor(public content: string, public options?: CodeBlockOptions) {}
		toString(): string {
			let result = "```";
			if (this.options?.language) result += this.options.language;
			if (this.options?.title) result += ` ${this.options.title}`;
			if (this.options?.lineNumbers) result += " :line-numbers";
			if (this.options?.highlight)
				result += ` :highlight=${this.options.highlight.map(h => `${h.start}-${h.end}`).join(",")}`;
			if (this.options?.end) result += ` :end=${this.options.end}`;
			result += "\n" + this.content + "\n```";
			if (this.options?.end) result += " " + this.options.end;
			return result;
		}
	}

	/*
		Quotes are blocks of text.
		Example:

		> Quote
		> Quote line 2
	*/
	export class Quote {
		type: "quote" = "quote";
		constructor(public content: Block[]) {}
		toString(): string {
			return this.content
				.map(c => c.toString())
				.map(line => "> " + line)
				.join("\n");
		}
	}

	/*
		Rules are horizontal lines.
		Example:

		---
	*/
	export class Rule {
		type: "rule" = "rule";
	}

	export type TableAlignment = "left" | "center" | "right";

	/*
		Table headers.
		Example:

		| Header | Header | Header | Header |
		| :-- | :---: | --: | --- |
	*/

	export class TableCell {
		type: "table-cell" = "table-cell";
		constructor(public content: Inline[]) {}
		toString(): string {
			return this.content.map(c => c.toString()).join("");
		}
	}

	export class TableRow {
		type: "table-row" = "table-row";
		constructor(public cells: TableCell[]) {}
		toString(): string {
			return this.cells.map(c => c.toString()).join(" | ");
		}
	}

	/*
		Tables are tabular data.
		Example:

		| Header | Header | Header | Header |
		| :-- | :---: | --: | --- |
		| Content | Content | Content | Content |
		| Content | Content | Content | Content |
	*/
	export class Table {
		type: "table" = "table";
		constructor(
			public rows: TableRow[],
			public header?: TableRow,
			public alignments?: TableAlignment[],
		) {}
		toString(): string {
			let result = "";
			if (this.header) result += this.header.toString() + "\n";
			if (this.alignments)
				result +=
					this.alignments
						.map(a => {
							switch (a) {
								case "left":
									return "---";
								case "center":
									return ":--:";
								case "right":
									return "---:";
							}
						})
						.join(" | ") + "\n";
			result += this.rows.map(r => r.toString()).join("\n");
			return result;
		}
	}

	/*
		Footnotes are references + content.
		Example:

		[^1] Footnote
	*/
	export class Footnote {
		type: "footnote" = "footnote";
		constructor(public reference: string, public content: Inline[]) {}
		toString(): string {
			return `[^${this.reference}] ${this.content.map(c => c.toString()).join("")}`;
		}
	}

	export type Block =
		| Call
		| Decorator
		| Comment
		| Paragraph
		| Heading
		| List
		| CodeBlock
		| Quote
		| Rule
		| Table
		| Footnote;
}

export type Block = Block.Block;

export namespace Inline {
	/*
		Text is a string of text.
		Example:

		Text
	*/
	export class Text {
		type: "text" = "text";
		constructor(public content: string) {}
		toString(): string {
			return this.content;
		}
	}

	/*
		Emphasis is a string of text with emphasis.
		Example:

		_Emphasis_
	*/
	export class Emphasis {
		type: "emphasis" = "emphasis";
		constructor(public content: Exclude<Inline, Emphasis>[]) {}
		toString(): string {
			return `_${this.content.map(c => c.toString()).join("")}_`;
		}
	}

	/*
		Strong is a string of text with strong emphasis.
		Example:

		*Strong*
	*/
	export class Strong {
		type: "strong" = "strong";
		constructor(public content: Exclude<Inline, Strong>[]) {}
		toString(): string {
			return `*${this.content.map(c => c.toString()).join("")}*`;
		}
	}

	/*
		Strikethrough is a string of text with strikethrough.
		Example:

		~~Strikethrough~~
	*/
	export class Strike {
		type: "strike" = "strike";
		constructor(public content: Exclude<Inline, Strike>[]) {}
		toString(): string {
			return `~~${this.content.map(c => c.toString()).join("")}~~`;
		}
	}

	/*
		Underline is a string of text with underline.
		Example:

		__Underline__
	*/
	export class Underline {
		type: "underline" = "underline";
		constructor(public content: Exclude<Inline, Underline>[]) {}
		toString(): string {
			return `__${this.content.map(c => c.toString()).join("")}__`;
		}
	}

	/*
		Code is a string of code.
		Example:

		`code`
	*/
	export class Code {
		type: "code" = "code";
		constructor(public content: string) {}
		toString(): string {
			return "`" + this.content + "`";
		}
	}

	/*
		Links are a string of text with a link.
		Example:

		[Link](https://example.com)
	*/
	export class Link {
		type: "link" = "link";
		constructor(
			public content: Exclude<Inline, { type: "link" | "image" }>[],
			public href: string,
		) {}
		toString(): string {
			return `[${this.content.map(c => c.toString()).join("")}](${this.href})`;
		}
	}

	/*
		Footnote references are markers to footnotes.
		Example:

		Authors discussed [^1] in their paper.
	*/
	export class FootnoteReference {
		type: "footnote-reference" = "footnote-reference";
		constructor(public reference: string) {}
		toString(): string {
			return `[^${this.reference}]`;
		}
	}

	export class VariableInterpolation {
		type: "interpolation" = "interpolation";
		constructor(public name: string) {}
		toString(): string {
			return "${" + this.name + "}";
		}
	}

	// TODO: reimplement as a decorator
	export interface ImageOptions {
		width?: number;
		height?: number;
		align?: "left" | "center" | "right";
		captioned?: boolean;
	}

	/*
		Images.
		Example:

		![alt text](https://example.com/image.jpg)
	*/
	export class Image {
		type: "image" = "image";
		constructor(
			public content: Exclude<Inline, { type: "link" | "image" }>[],
			public src: string,
		) {}
		toString(): string {
			return `![${this.content.map(c => c.toString()).join("")}](${this.src})`;
		}
	}

	export type Inline =
		| Text
		| Emphasis
		| Strong
		| Strike
		| Underline
		| Code
		| Link
		| FootnoteReference
		| Image
		| VariableInterpolation;
}

export type Inline = Inline.Inline;

export class AST {
	constructor(public blocks: Block[], public meta?: Meta) {}
}
