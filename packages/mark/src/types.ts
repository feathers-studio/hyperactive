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
	constructor(public parameters: Block.Call.Parameters) {}
}

export namespace Block {
	/*
		Define extensions as a call to a function.
		Example:

		=figure(
			src: "https://example.com/image.jpg",
			caption: "An example image"
		)
	*/
	export namespace Call {
		export class Parameter {
			type: "parameter" = "parameter";
			constructor(public name: string, public value: Value | Call) {}
		}

		export class Parameters {
			type: "parameters" = "parameters";
			constructor(public parameters: Parameter[]) {}
		}

		export class Call {
			type: "call" = "call";
			constructor(public name: string, public parameters: Parameters) {}
		}
	}

	export type Call = Call.Call;

	export class Decorator {
		type: "decorator" = "decorator";
		constructor(
			public name: string,
			public parameters: Block.Call.Parameters,
			public blocks: Block[],
		) {}
	}

	/*
		Single-line comments only.
		Example:

		-- comment
	 */
	export class Comment {
		type: "comment" = "comment";
		constructor(public content: string) {}
	}

	/*
		Paragraphs are blocks of text.
		Example:

		Paragraph
	*/
	export class Paragraph {
		type: "paragraph" = "paragraph";
		constructor(public content: Inline[]) {}
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
	}

	export class TableRow {
		type: "table-row" = "table-row";
		constructor(public cells: TableCell[]) {}
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
	}

	/*
		Footnotes are references + content.
		Example:

		[^1] Footnote
	*/
	export class Footnote {
		type: "footnote" = "footnote";
		constructor(public reference: string, public content: Inline[]) {}
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
	}

	/*
		Emphasis is a string of text with emphasis.
		Example:

		_Emphasis_
	*/
	export class Emphasis {
		type: "emphasis" = "emphasis";
		constructor(public content: Exclude<Inline, Emphasis>[]) {}
	}

	/*
		Strong is a string of text with strong emphasis.
		Example:

		*Strong*
	*/
	export class Strong {
		type: "strong" = "strong";
		constructor(public content: Exclude<Inline, Strong>[]) {}
	}

	/*
		Strikethrough is a string of text with strikethrough.
		Example:

		~~Strikethrough~~
	*/
	export class Strike {
		type: "strike" = "strike";
		constructor(public content: Exclude<Inline, Strike>[]) {}
	}

	/*
		Underline is a string of text with underline.
		Example:

		__Underline__
	*/
	export class Underline {
		type: "underline" = "underline";
		constructor(public content: Exclude<Inline, Underline>[]) {}
	}

	/*
		Code is a string of code.
		Example:

		`code`
	*/
	export class Code {
		type: "code" = "code";
		constructor(public content: string) {}
	}

	/*
		Links are a string of text with a link.
		Example:

		[Link](https://example.com)
	*/
	export class Link {
		type: "link" = "link";
		constructor(public content: Exclude<Inline, Link>[], public href: string) {}
	}

	/*
		Footnote references are markers to footnotes.
		Example:

		Authors discussed [^1] in their paper.
	*/
	export class FootnoteReference {
		type: "footnote-reference" = "footnote-reference";
		constructor(public reference: string) {}
	}

	export class VariableInterpolation {
		type: "interpolation" = "interpolation";
		constructor(public name: string) {}
	}

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
		constructor(public src: string, public alt: string, public options?: ImageOptions) {}
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
