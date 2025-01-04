import { type Token } from "./lexer";
import { Call, Block, Inline, type Value } from "./types";

export class Parser {
	private current = 0;
	private tokens: Token[] = [];

	constructor(tokens: Token[]) {
		this.tokens = tokens;
	}

	private peek(offset = 0): Token {
		return this.tokens[this.current + offset];
	}

	private previous(offset = 0): Token {
		return this.tokens[this.current - 1 - offset];
	}

	private advance(count = 1): Token {
		if (!this.isEOF()) this.current += count;
		return this.previous();
	}

	private isEOF(): boolean {
		return this.current >= this.tokens.length;
	}

	private match(...types: Token["type"][]): boolean {
		for (const type of types) {
			if (this.check(type)) {
				this.advance();
				return true;
			}
		}
		return false;
	}

	private check(type: Token["type"]): boolean {
		if (this.isEOF()) return false;
		return this.peek().type === type;
	}

	private parseCall(): Call.Call {
		// Expect =name(params)
		this.advance(); // consume CALL_START
		if (!this.check("CALL_NAME")) {
			throw new Error("Expected function name after '='");
		}
		const name = this.advance().value; // consume CALL_NAME

		if (!this.check("PAREN_OPEN")) {
			throw new Error(`Expected '(' after function name '${name}'`);
		}
		this.advance(); // consume PAREN_OPEN

		const parameters = this.parseCallParameters();
		return new Call.Call(name, parameters);
	}

	private parseCallParameters(): Call.Parameters {
		const parameters: Call.Parameter[] = [];

		// Handle empty parameter list
		if (this.check("PAREN_CLOSE")) {
			this.advance(); // consume the closing parenthesis
			return new Call.Parameters(parameters);
		}

		do {
			// Parse parameter name
			if (!this.check("IDENTIFIER")) {
				throw new Error(`Expected parameter name, got '${this.peek().type}'`);
			}
			const name = this.advance().value;

			// Parse colon
			if (!this.check("COLON")) {
				throw new Error(`Expected ':' after parameter name '${name}', got '${this.peek().type}'`);
			}
			this.advance(); // consume the colon

			const value = this.parseValue();
			parameters.push(new Call.Parameter(name, value));
		} while (this.match("COMMA"));

		if (!this.match("PAREN_CLOSE")) {
			throw new Error("Expected ')' after parameters");
		}

		return new Call.Parameters(parameters);
	}

	private parseValue(): Value | Call.Call {
		if (this.isEOF()) {
			throw new Error("Unexpected end of input while parsing value");
		}

		// Handle nested calls
		if (this.check("CALL_START")) {
			return this.parseCall();
		}

		const token = this.advance();
		switch (token.type) {
			case "STRING":
				return token.value;
			case "NUMBER":
				return Number(token.value);
			case "BOOLEAN":
				return token.value === "true";
			case "NULL":
				return null;
			case "CALL_START": // In case we missed it in the first check
				this.current--; // back up to reparse as call
				return this.parseCall();
			default:
				throw new Error(`Expected value, got ${token.type}`);
		}
	}

	private parseCodeGroup(): Block.CodeGroup {
		this.advance().value; // consume CODE_GROUP_START
		let title = "";
		if (this.check("CODE_GROUP_NAME")) title = this.advance().value;
		else throw new Error("Expected code group name");
		if (this.check("NEWLINE")) this.advance(); // consume NEWLINE
		else throw new Error("Expected newline after code group name");

		const blocks: Block.CodeBlock[] = [];
		while (this.peek().type !== "CODE_GROUP_END") {
			if (this.peek().type === "NEWLINE") {
				this.advance();
				continue;
			} else if (this.peek().type === "CODE_START") {
				blocks.push(this.parseCodeBlock());
			} else {
				throw new Error(`Expected code block, got ${this.peek().type}`);
			}
		}
		this.advance(); // consume CODE_GROUP_END
		return new Block.CodeGroup(title, blocks);
	}

	private parseCodeBlock(): Block.CodeBlock {
		this.advance(); // consume CODE_START

		// Consume the CODE_LANG token if present
		let language = "";
		let title = "";
		let lineNumbers = false;
		let highlight: Block.HighlightRange[] = [];

		if (this.check("CODE_LANG")) {
			const parts = this.advance().value.split(" ");

			// First part is always the language
			language = parts[0];

			// Parse remaining parts
			for (let i = 1; i < parts.length; i++) {
				const part = parts[i];
				if (part.startsWith(":")) {
					// Parameter
					const param = part.slice(1);
					if (param === "line-numbers") {
						lineNumbers = true;
					} else if (param.startsWith("highlight=")) {
						highlight = param
							.slice("highlight=".length)
							.split(",")
							.map(range => {
								const [start, end] = range.split("-").map(Number);
								if (end) return { start, end };
								return { start, end: start };
							});
					}
				} else if (title === "" && !part.startsWith(":")) {
					// First non-parameter part is the title
					title = part;
				}
			}
		}

		// Consume the NEWLINE after language
		if (this.check("NEWLINE")) {
			this.advance();
		}

		// Get the code content
		let content = "";
		if (this.check("CODE_CONTENT")) {
			content = this.advance().value;
		}

		// Consume the CODE_END token
		if (!this.check("CODE_END")) {
			throw new Error("Expected code block closing");
		}
		this.advance();

		// Consume trailing newline if present
		if (this.check("NEWLINE")) {
			this.advance();
		}

		return new Block.CodeBlock(content, { language, title, lineNumbers, highlight });
	}

	private parseQuote(): Block.Quote {
		let content: Block.Block[] = [];
		let currentParagraph: Inline.Inline[] = [];

		while (!this.isEOF()) {
			if (this.check("QUOTE_MARKER")) {
				// Consume the quote marker
				this.advance();

				// Skip one space if present
				if (this.check("TEXT") && this.peek().value === " ") {
					this.advance();
				}
			} else if (this.check("NEWLINE")) {
				// End current paragraph if we have content
				if (currentParagraph.length > 0) {
					content.push(new Block.Paragraph(currentParagraph));
					currentParagraph = [];
				}
				this.advance();

				// Check if next line starts with quote marker
				if (!this.check("QUOTE_MARKER")) {
					break;
				}
			} else if (this.check("TEXT")) {
				// Add text to current paragraph
				if (currentParagraph.length > 0) {
					// Add space between text tokens
					currentParagraph.push(new Inline.Text(" "));
				}
				currentParagraph.push(new Inline.Text(this.advance().value));
			} else {
				break;
			}
		}

		// Add final paragraph if we have content
		if (currentParagraph.length > 0) {
			content.push(new Block.Paragraph(currentParagraph));
		}

		return new Block.Quote(content);
	}

	private parseInline(): Inline.Inline {
		if (this.check("TEXT")) {
			return new Inline.Text(this.advance().value);
		} else if (this.check("STRONG") || this.check("EMPHASIS")) {
			const marker = this.advance();
			const isDouble = this.check(marker.type);

			if (isDouble) {
				this.advance(); // consume second marker
				const content = this.parseInlineContent();
				if (!this.match(marker.type, marker.type)) {
					throw new Error("Unclosed strong emphasis");
				}
				return new Inline.Strong(content);
			} else {
				const content = this.parseInlineContent();
				if (!this.match(marker.type)) {
					throw new Error("Unclosed emphasis");
				}
				return new Inline.Emphasis(content);
			}
		} else if (this.check("CODE_SINGLE")) {
			this.advance();
			let content = "";
			while (!this.isEOF() && !this.check("CODE_SINGLE")) {
				if (this.check("TEXT")) {
					content += this.advance().value;
				} else {
					content += this.advance().type; // fallback for other tokens
				}
			}
			if (!this.match("CODE_SINGLE")) {
				throw new Error("Unclosed inline code");
			}
			return new Inline.Code(content);
		} else if (this.check("LINK_OPEN")) {
			this.advance();
			const text = this.parseInlineContent();
			if (!this.match("LINK_CLOSE")) {
				throw new Error("Unclosed link text");
			}
			if (!this.match("PAREN_OPEN")) {
				throw new Error("Expected link URL");
			}
			let url = "";
			while (!this.isEOF() && !this.check("PAREN_CLOSE")) {
				url += this.advance().value;
			}
			if (!this.match("PAREN_CLOSE")) {
				throw new Error("Unclosed link URL");
			}
			return new Inline.Link(text, url);
		} else if (this.check("IMAGE_OPEN")) {
			this.advance();
			const alt = this.parseInlineContent();
			if (!this.match("LINK_CLOSE")) {
				throw new Error("Unclosed image alt text");
			}
			if (!this.match("PAREN_OPEN")) {
				throw new Error("Expected image URL");
			}
			let url = "";
			while (!this.isEOF() && !this.check("PAREN_CLOSE")) {
				url += this.advance().value;
			}
			if (!this.match("PAREN_CLOSE")) {
				throw new Error("Unclosed image URL");
			}
			return new Inline.Image(alt, url);
		} else {
			throw new Error(`Unexpected token ${this.peek().type}`);
		}
	}

	// until allows us to parse inline content until a certain token, such as newline, table pipe, etc.
	private parseInlineContent(until: Token["type"] = "NEWLINE"): Inline.Inline[] {
		const content: Inline.Inline[] = [];
		while (
			!this.isEOF() &&
			!this.check(until) &&
			!this.check("LINK_CLOSE") &&
			!this.check("STRONG") &&
			!this.check("EMPHASIS") &&
			!this.check("CODE_SINGLE")
		) {
			content.push(this.parseInline());
		}
		return content;
	}

	private parseTableCell(): Block.TableCell | Block.TableAlignment {
		let content: Inline.Inline[] | undefined = undefined;
		let alignment: Block.TableAlignment | undefined = undefined;
		while (!this.check("PIPE")) {
			if (this.check("ALIGN")) {
				if (content) throw new Error("Cannot have content and alignment in the same cell");
				if (alignment) throw new Error("Cannot have multiple alignments in a cell");
				alignment = this.advance().value as Block.TableAlignment;
			}
			// TODO: parse align cell
			if (alignment) throw new Error("Cannot have alignment in the middle of a cell");
			if (!content) content = [];
			content.push(this.parseInline());
		}
		return alignment ?? new Block.TableCell(content!);
	}

	private parseTableRow(): Block.TableRow | Block.TableAlignment[] {
		let cells: Block.TableCell[] | undefined = undefined;
		let alignments: Block.TableAlignment[] | undefined = undefined;

		while (!this.check("NEWLINE")) {
			if (this.check("PIPE")) {
				this.advance();
			} else throw new Error("Expected pipe");

			const cell = this.parseTableCell();
			if (cell instanceof Block.TableCell) {
				if (alignments) throw new Error("Cannot have alignment and content in the same row");
				if (!cells) cells = [];
				cells.push(cell);
			} else {
				if (cells) throw new Error("Cannot have alignment and content in the same row");
				if (!alignments) alignments = [];
				alignments.push(cell);
			}
		}

		if (this.check("NEWLINE")) {
			this.advance();
		} else throw new Error("Expected newline");

		return alignments ?? new Block.TableRow(cells!);
	}

	private parseTable(): Block.Table {
		const rows: Block.TableRow[] = [];
		let header: Block.TableRow | undefined = undefined;
		let alignments: Block.TableAlignment[] | undefined = undefined;

		let index = 0;
		let lastRowLength: number | undefined = undefined;

		// parse a row when we see a pipe
		while (this.check("PIPE")) {
			this.advance(); // consume PIPE
			const row = this.parseTableRow();
			const length = row instanceof Block.TableRow ? row.cells.length : row.length;

			if (lastRowLength === undefined) {
				lastRowLength = length;
			} else if (lastRowLength !== length) {
				throw new Error("All rows must have the same number of cells");
			}

			if (row instanceof Block.TableRow) {
				rows.push(row);
			} else {
				if (index !== 1) throw new Error("Alignments must be in the second row");
				alignments = row;
				header = rows.shift();
			}

			index++;
		}

		return new Block.Table(rows, header, alignments);
	}

	public parse() {
		const blocks: (Block.Block | Call.Call)[] = [];
		let currentList: Block.List | null = null;

		while (!this.isEOF()) {
			try {
				if (this.check("COMMENT")) {
					blocks.push(new Block.Comment(this.advance().value));
				} else if (this.check("CALL_START")) {
					blocks.push(this.parseCall());
				} else if (this.check("HEADING")) {
					blocks.push(this.parseHeading());
				} else if (this.check("CODE_GROUP_START")) {
					blocks.push(this.parseCodeGroup());
				} else if (this.check("CODE_START")) {
					blocks.push(this.parseCodeBlock());
				} else if (this.check("QUOTE_MARKER")) {
					blocks.push(this.parseQuote());
				} else if (this.check("PIPE")) {
					blocks.push(this.parseTable());
				} else if (this.check("LIST_MARKER")) {
					const item = this.parseListItem();
					if (!currentList) {
						currentList = new Block.List(false, [item]);
						blocks.push(currentList);
					} else {
						currentList.items.push(item);
					}
				} else if (!this.check("NEWLINE")) {
					// End current list if we see anything else except newline
					currentList = null;
					this.advance();
				} else {
					this.advance();
				}
			} catch (error) {
				const errorPosition = !this.isEOF() ? `at line ${this.peek().position.line}` : "at end of input";
				throw new Error(`Parse error ${errorPosition}: ${(error as Error).message}`);
			}
		}

		return blocks;
	}

	private parseHeading(): Block.Heading {
		const token = this.advance(); // consume HEADING
		const level = token.value.length; // number of # characters

		if (level < 1 || level > 6) {
			throw new Error(`Invalid heading level: ${level}`);
		}

		const lvl = level as Block.HeadingLevel;

		const content = this.parseInlineContent();

		// Consume the newline if present
		if (this.check("NEWLINE")) {
			this.advance();
		}

		return new Block.Heading(lvl, content);
	}

	private parseListItem(): Block.ListItem | Block.TaskItem {
		this.advance(); // consume LIST_MARKER

		// Check for task marker
		if (this.check("TASK_MARKER")) {
			const taskMarker = this.advance().value;
			const checked = taskMarker === "[x]";
			return new Block.TaskItem(this.parseInlineContent(), checked);
		}

		return new Block.ListItem(this.parseInlineContent());
	}
}
