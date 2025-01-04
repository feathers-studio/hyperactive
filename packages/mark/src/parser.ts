import { type Token } from "./lexer";
import { Call, Block, Inline, type Value } from "./types";

export class Parser {
	private current = 0;
	private tokens: Token[] = [];

	constructor(tokens: Token[]) {
		this.tokens = tokens;
	}

	private peek(): Token {
		return this.tokens[this.current];
	}

	private previous(): Token {
		return this.tokens[this.current - 1];
	}

	private advance(): Token {
		if (!this.isAtEnd()) this.current++;
		return this.previous();
	}

	private isAtEnd(): boolean {
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
		if (this.isAtEnd()) return false;
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
		if (this.isAtEnd()) {
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

		while (!this.isAtEnd()) {
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

	public parse() {
		const blocks: (Block.Block | Call.Call)[] = [];
		let currentList: Block.List | null = null;

		while (!this.isAtEnd()) {
			try {
				if (this.check("CALL_START")) {
					blocks.push(this.parseCall());
				} else if (this.check("HEADING")) {
					blocks.push(this.parseHeading());
				} else if (this.check("CODE_START")) {
					blocks.push(this.parseCodeBlock());
				} else if (this.check("QUOTE_MARKER")) {
					blocks.push(this.parseQuote());
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
				const errorPosition = !this.isAtEnd() ? `at line ${this.peek().position.line}` : "at end of input";
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

		const content: Inline[] = [];

		// Parse content until newline
		while (!this.isAtEnd() && !this.check("NEWLINE")) {
			if (this.check("TEXT")) {
				content.push(new Inline.Text(this.advance().value));
			} else {
				this.advance(); // skip other tokens for now
			}
		}

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

	private parseInlineContent(): Block.Paragraph[] {
		const content: Inline.Inline[] = [];
		let currentText = "";

		while (!this.isAtEnd() && !this.check("NEWLINE")) {
			if (this.check("TEXT")) {
				currentText += this.advance().value;
			} else if (currentText) {
				content.push(new Inline.Text(currentText));
				currentText = "";
				this.advance(); // skip other tokens for now
			} else {
				this.advance(); // skip other tokens for now
			}
		}

		// Add any remaining text
		if (currentText) {
			content.push(new Inline.Text(currentText));
		}

		// Consume the newline
		if (this.check("NEWLINE")) {
			this.advance();
		}

		return [new Block.Paragraph(content)];
	}
}
