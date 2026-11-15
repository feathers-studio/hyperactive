export type Value =
	// primitives
	| string
	| number
	| boolean
	| null
	// arrays
	| Value[]
	// objects
	| { [key: string]: Value }
	// `[text](url)` and `![alt](url)`, so a call still shows a working link or image on GitHub
	| Inline.Link
	| Inline.Image;

/** A place in the source file, as in unist: `line` and `column` from 1, `offset` from 0. */
export interface Point {
	line: number;
	column: number;
	offset: number;
}

/** Where a node was written: from `start` up to, not including, `end`. */
export interface Position {
	start: Point;
	end: Point;
}

/*
	meta is simply a special call that can only appear at the top of the document.
*/
export class Meta {
	type: "meta" = "meta";
	declare position?: Position;
	constructor(public parameters: Block.Parameters) {}
}

export namespace Block {
	/** A value as Hypermark source: JSON, except for the nodes JSON would print field by field. */
	function value_to_string(value: Value | Call): string {
		if (value instanceof Inline.Link || value instanceof Inline.Image || value instanceof Call) {
			return value.toString();
		}
		if (Array.isArray(value)) return `[${value.map(value_to_string).join(", ")}]`;
		if (value !== null && typeof value === "object") {
			const entries = Object.entries(value).map(([key, v]) => `${JSON.stringify(key)}: ${value_to_string(v)}`);
			return entries.length ? `{ ${entries.join(", ")} }` : "{}";
		}
		return JSON.stringify(value);
	}

	export class Parameter {
		type: "parameter" = "parameter";
		constructor(public name: string, public value: Value | Call) {}
		toString(): string {
			if (this.name === "__default") return value_to_string(this.value);
			if (this.value === true) return this.name; // a flag
			return `${this.name}: ${value_to_string(this.value)}`;
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
		declare position?: Position;
		constructor(public name: string, public parameters: Parameters) {}
		toString(): string {
			return `=${this.name}(${this.parameters.toString()})`;
		}
	}

	export class Decorator {
		type: "decorator" = "decorator";
		declare position?: Position;
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
		declare position?: Position;
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
		declare position?: Position;
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
		declare position?: Position;
		constructor(public level: HeadingLevel, public content: Inline[]) {}
		toString(): string {
			return `${"#".repeat(this.level)} ${this.content.map(c => c.toString()).join("")}`;
		}
	}

	export interface ListOptions {
		start_marker: string;
		ordered?: boolean;
		has_tasks?: boolean;
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
		declare position?: Position;
		constructor(public items: (ListItem | TaskItem)[], public options?: ListOptions) {}
		toString(): string {
			const ordered = this.options?.ordered ?? false;
			const start = ordered ? Number.parseInt(this.options!.start_marker, 10) : 0;
			return this.items
				.map((item, i) => {
					const marker = ordered ? `${start + i}.` : (this.options?.start_marker ?? "-");
					// Later lines are indented to the content column, or they would fall out of
					// the item when parsed again.
					const pad = " ".repeat(marker.length + 1);
					const [first = "", ...rest] = item.toString().split("\n");
					return [`${marker} ${first}`, ...rest.map(line => (line ? pad + line : line))].join("\n");
				})
				.join("\n");
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
		declare position?: Position;
		constructor(public content: Block[]) {}
		/** The item's content without its marker, which belongs to the list. */
		toString(): string {
			// Blocks are separated by a blank line, or two paragraphs would read back as one.
			return this.content.map(c => c.toString()).join("\n\n");
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
		declare position?: Position;
		constructor(public content: Block[], public checked: boolean) {}
		/** The item's checkbox and content, without its marker, which belongs to the list. */
		toString(): string {
			return `[${this.checked ? "x" : " "}] ${this.content.map(c => c.toString()).join("\n\n")}`;
		}
	}

	export interface CodeBlockOptions {
		/** The first word of the opening line, or "" for none. */
		language: string;
		title?: string;
		/** Open-ended: the renderer decides which names it understands. */
		params?: Parameters;
	}

	/*
		Code blocks are blocks of code.
		Example:

		```ts bot.ts (highlight: "1-3", line-numbers)
		content
		```

		A fence longer than any line of backticks in the content is how a block shows
		another block.
	 */
	/** Where an expanded `=code()` block came from. */
	export interface CodeSource {
		/** The file as written in the call. */
		url: string;
		/** The file's path from the project root, which `url` resolved to. */
		path: string;
		region?: string;
		/** The whole file, region markers included: twoslash needs what surrounds a region. */
		text: string;
		/** The lines of `text` that `content` came from, 0-based, `end` exclusive. */
		lines: { start: number; end: number };
	}

	export class CodeBlock {
		type: "code-block" = "code-block";
		declare position?: Position;
		constructor(
			public content: string,
			public options?: CodeBlockOptions,
			public source?: CodeSource,
		) {}
		toString(): string {
			// One backtick longer than the longest line in the content that would close it.
			const closers = this.content.match(/^ {0,3}`{3,}[ \t]*$/gm) ?? [];
			const longest = Math.max(2, ...closers.map(line => line.trim().length));
			const fence = "`".repeat(longest + 1);

			let info = this.options?.language ?? "";
			const title = this.options?.title;
			if (title !== undefined) {
				// Quoted only when a bare word would read back as something else.
				info += " " + (/^[^\s"'(]+$/.test(title) ? title : JSON.stringify(title));
			}
			if (this.options?.params?.parameters.length) info += ` (${this.options.params})`;

			return `${fence}${info}\n${this.content}\n${fence}`;
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
		declare position?: Position;
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
		declare position?: Position;
	}

	export type TableAlignment = "left" | "center" | "right";

	export class TableAlignmentRow {
		type: "table-alignment-row" = "table-alignment-row";
		constructor(public alignment: TableAlignment[]) {}
		toString(): string {
			let result = "|";
			for (const alignment of this.alignment) {
				switch (alignment) {
					case "left":
						result += " ----";
						break;
					case "center":
						result += " :--:";
						break;
					case "right":
						result += " ---:";
						break;
				}

				result += " |";
			}

			return result + " |";
		}
	}

	/*
		Table headers.
		Example:

		| Header | Header | Header | Header |
		| :-- | :---: | --: | --- |
	*/

	export class TableCell {
		type: "table-cell" = "table-cell";
		declare position?: Position;
		constructor(public content: Inline[]) {}
		toString(): string {
			return this.content.map(c => c.toString()).join("");
		}
	}

	export class TableRow {
		type: "table-row" = "table-row";
		declare position?: Position;
		constructor(public cells: TableCell[]) {}
		toString(): string {
			return "| " + this.cells.map(c => c.toString()).join(" | ") + " |";
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
		declare position?: Position;
		constructor(
			public rows: TableRow[],
			public header?: TableRow,
			public alignments?: TableAlignmentRow,
		) {}
		toString(): string {
			// TODO: attempt to pretty-print tables
			let result = "";
			if (this.header) result += this.header.toString() + "\n";
			if (this.alignments) result += this.alignments.toString() + "\n";
			result += this.rows.map(r => r.toString()).join("\n");
			return result;
		}
	}

	/*
		Footnotes are references + content.
		Example:

		[^1]: Footnote
	*/
	export class Footnote {
		type: "footnote" = "footnote";
		declare position?: Position;
		constructor(public reference: string, public content: Inline[]) {}
		toString(): string {
			return `[^${this.reference}]: ${this.content.map(c => c.toString()).join("")}`;
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

// `~` opens strike, so text holding one must be escaped or it reads back struck.
const special = ["\\", "*", "_", "~", "@", "=", "[", "`", "#", "-", "|", "<"];
const specialRegExp = new RegExp(`[${special.map(c => "\\" + c).join("")}]`, "g");

export namespace Inline {
	/*
		Text is a string of text.
		Example:

		Text
	*/
	export class Text {
		type: "text" = "text";
		declare position?: Position;
		constructor(public content: string) {}
		toString(): string {
			return this.content.replaceAll(specialRegExp, match => `\\${match}`);
		}
	}

	/*
		Emphasis is a string of text with emphasis.
		Example:

		_Emphasis_
	*/
	export class Emphasis {
		type: "emphasis" = "emphasis";
		declare position?: Position;
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
		declare position?: Position;
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
		declare position?: Position;
		constructor(public content: Exclude<Inline, Strike>[]) {}
		toString(): string {
			return `~${this.content.map(c => c.toString()).join("")}~`;
		}
	}

	/*
		Code is a string of code.
		Example:

		`code`
	*/
	export class Code {
		type: "code" = "code";
		declare position?: Position;
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
		declare position?: Position;
		constructor(
			public content: Exclude<Inline, { type: "link" | "image" }>[],
			/** Named as in mdast, and shared with Image, so code taking either reads one field. */
			public url: string,
		) {}
		toString(): string {
			return `[${this.content.map(c => c.toString()).join("")}](${this.url})`;
		}
	}

	/*
		Footnote references are markers to footnotes.
		Example:

		Authors discussed [^1] in their paper.
	*/
	export class FootnoteReference {
		type: "footnote-reference" = "footnote-reference";
		declare position?: Position;
		constructor(public reference: string) {}
		toString(): string {
			return `[^${this.reference}]`;
		}
	}

	export class VariableInterpolation {
		type: "interpolation" = "interpolation";
		declare position?: Position;
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
		declare position?: Position;
		constructor(
			public content: Exclude<Inline, { type: "link" | "image" }>[],
			public url: string,
		) {}
		toString(): string {
			return `![${this.content.map(c => c.toString()).join("")}](${this.url})`;
		}
	}

	export type Inline =
		| Text
		| Emphasis
		| Strong
		| Strike
		| Code
		| Link
		| FootnoteReference
		| Image
		| VariableInterpolation;
}

export type Inline = Inline.Inline;

export interface FootnoteCollection {
	[key: string]: Block.Footnote;
}

export class HypermarkDocument {
	public meta?: Meta;
	public footnote_collection: FootnoteCollection = {};

	constructor(public blocks: Block[] = []) {}
}
