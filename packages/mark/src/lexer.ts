// TODO: Error recovery
// on encountering an error, read the rest of the line and add it as a text token
// Insert an error token at the point of error, then continue lexing after the newline

import type { Block } from "./types";

type CallTokenType =
	| "CALL_START"
	| "CALL_NAME"
	| "PAREN_OPEN"
	| "PAREN_CLOSE"
	| "COLON"
	| "COMMA"
	| "STRING"
	| "NUMBER"
	| "BOOLEAN"
	| "NULL"
	| "IDENTIFIER";

type BlockTokenType =
	| "NEWLINE"
	| "HEADING"
	| "LIST_MARKER"
	| "TASK_MARKER"
	| "CODE_START"
	| "CODE_LANG"
	| "CODE_CONTENT"
	| "CODE_END"
	| "QUOTE"
	| "RULE"
	| "COMMENT"
	| "QUOTE_MARKER"
	| "PIPE"
	| "ALIGN"
	| "CODE_GROUP_START"
	| "CODE_GROUP_NAME"
	| "CODE_GROUP_END";

type InlineTokenType =
	| "WHITESPACE"
	| "TEXT"
	| "EMPHASIS"
	| "STRONG"
	| "STRIKE"
	| "CODE_SINGLE"
	| "LINK_OPEN"
	| "LINK_CLOSE"
	| "LINK_TEXT_OPEN"
	| "LINK_TEXT_CLOSE"
	| "IMAGE_OPEN"
	| "FOOTNOTE_REF";

type TokenType = CallTokenType | BlockTokenType | InlineTokenType;

export interface Token {
	type: TokenType;
	value: string;
	position: {
		start: number;
		end: number;
		line: number;
		column: number;
	};
}

export class Lexer {
	private pos = 0;
	private line = 1;
	private column = 0;
	private tokens: Token[] = [];

	constructor(private input: string) {}

	private peek(offset = 0, length = 1): string {
		return this.input.slice(this.pos + offset, this.pos + offset + length);
	}

	private peekUntil(char: string): string {
		let foundIndex: number | null = null;
		for (let i = this.pos; i < this.input.length; i++) {
			if (this.input[i] === char) {
				foundIndex = i;
				break;
			}
		}
		if (foundIndex === null) return this.input.slice(this.pos);
		return this.input.slice(this.pos, foundIndex);
	}

	private previous(): Token | undefined {
		return this.tokens[this.tokens.length - 1];
	}

	private advance(count = 1): void {
		for (let i = 0; i < count; i++) {
			if (this.peek() === "\n") {
				this.line++;
				this.column = 0;
			} else {
				this.column++;
			}
			this.pos++;
		}
	}

	private addToken(type: TokenType, value: string, length = value.length): void {
		const position = {
			start: this.pos,
			end: this.pos + length,
			line: this.line,
			column: this.column,
		};

		const isWhitespace = type === "TEXT" && /^\s+$/.test(value);
		type = isWhitespace ? "WHITESPACE" : type;

		const token = { type, value, position };

		this.tokens.push(token);
	}

	public tokenize(): Token[] {
		while (!this.hasEnded()) {
			const char = this.peek();

			switch (char) {
				case "=":
					// this handles COLON COMMA PAREN_OPEN PAREN_CLOSE STRING NUMBER BOOLEAN NULL IDENTIFIER
					if (this.isNewLine()) this.lexCall();
					else this.lexText();
					break;
				case "#":
					this.lexHeading();
					break;
				case "|": {
					this.addToken("PIPE", "|");
					this.advance();

					const alignment = this.readTableAlignment();
					if (alignment) this.addToken("ALIGN", alignment);

					break;
				}
				case "_":
					this.lexEmphasisOrStrong();
					break;
				case "*":
					if (this.isLineIndented() && this.peek(1) === " ") {
						this.lexListMarker();
					} else {
						this.lexEmphasisOrStrong();
					}
					break;
				case "-":
					if (this.isRule()) {
						this.lexRule();
					} else if (this.isComment()) {
						this.lexComment();
					} else if (this.isLineIndented() && this.peek(1) === " ") {
						this.lexListMarker();
					} else {
						this.lexText();
					}
					break;
				case ":":
					if (this.isNewLine()) {
						if (this.peek(0, 3) === ":::") {
							this.advance(3);
							if (this.peek() === " ") {
								this.addToken("CODE_GROUP_START", "::: ");
								this.advance();
								let title = "";
								while (!this.hasEnded() && this.peek() !== "\n") {
									title += this.peek();
									this.advance();
								}
								this.addToken("CODE_GROUP_NAME", title);
							} else {
								this.addToken("CODE_GROUP_END", ":::");
								this.advance();
							}
						}
					} else this.lexText();
					break;
				case "`":
					if (this.isNewLine() && this.isCodeFence()) {
						this.lexCodeBlock();
					} else {
						this.lexInlineCode();
					}
					break;
				case ">":
					if (this.isNewLine()) {
						this.addToken("QUOTE_MARKER", ">");
						this.advance();
						// Skip one space after quote marker if present
						if (this.peek() === " ") {
							this.advance();
						}
					} else {
						this.lexText();
					}
					break;
				case "\n":
					this.addToken("NEWLINE", "\n");
					this.advance();
					break;
				case "!":
					if (this.peek(1) === "[") {
						this.addToken("IMAGE_OPEN", "![");
						this.advance(2);
						this.lexLinkOrFootnote();
					} else {
						this.lexText();
					}
					break;
				case "[":
					this.addToken("LINK_TEXT_OPEN", "[");
					this.advance();
					this.lexLinkOrFootnote();
					break;
				default:
					this.lexText();
					break;
			}
		}

		return this.tokens;
	}

	private lexCall(): void {
		this.addToken("CALL_START", "=");
		this.advance();

		// Must be followed by a function name
		if (!/[a-zA-Z_]/.test(this.peek())) {
			throw new Error("Expected function name after '='");
		}

		// Collect function name
		let name = "";
		while (!this.hasEnded() && /[a-zA-Z0-9_]/.test(this.peek())) {
			name += this.peek();
			this.advance();
		}
		this.addToken("CALL_NAME", name);

		// Skip whitespace
		while (this.peek() === " ") {
			this.advance();
		}

		// Must be followed by an opening parenthesis
		if (this.peek() !== "(") {
			throw new Error("Expected '(' after function name");
		}
		this.addToken("PAREN_OPEN", "(");
		this.advance();

		// Parse parameters until closing parenthesis
		while (!this.hasEnded() && this.peek() !== ")") {
			// Skip whitespace
			while (this.peek() === " ") {
				this.advance();
			}

			if (this.peek() === ")") break;

			// Parse parameter name
			if (!/[a-zA-Z_]/.test(this.peek())) {
				throw new Error("Expected parameter name");
			}

			let param = "";
			while (!this.hasEnded() && /[a-zA-Z0-9_]/.test(this.peek())) {
				param += this.peek();
				this.advance();
			}
			this.addToken("IDENTIFIER", param);

			// Skip whitespace
			while (this.peek() === " ") {
				this.advance();
			}

			// Must be followed by a colon
			if (this.peek() !== ":") {
				throw new Error(`Expected ':' after parameter name '${param}'`);
			}
			this.addToken("COLON", ":");
			this.advance();

			// Skip whitespace
			while (this.peek() === " ") {
				this.advance();
			}

			// Parse parameter value
			if (this.peek() === '"' || this.peek() === "'") {
				this.lexString();
			} else if (/[0-9-]/.test(this.peek())) {
				this.lexNumber();
			} else if (/[a-zA-Z_]/.test(this.peek())) {
				this.lexIdentifierValue();
			} else if (this.peek() === "=") {
				this.lexCall(); // Handle nested calls
			} else {
				throw new Error("Expected parameter value");
			}

			// Skip whitespace
			while (this.peek() === " ") {
				this.advance();
			}

			// Check for comma or end of parameters
			if (this.peek() === ",") {
				this.addToken("COMMA", ",");
				this.advance();
			} else if (this.peek() !== ")") {
				throw new Error("Expected ',' or ')'");
			}
		}

		if (this.peek() !== ")") {
			throw new Error("Expected ')'");
		}
		this.addToken("PAREN_CLOSE", ")");
		this.advance();
	}

	private lexNumber(): void {
		let num = "";
		if (this.peek() === "-") {
			num += this.peek();
			this.advance();
		}
		while (!this.hasEnded() && /[0-9.]/.test(this.peek())) {
			num += this.peek();
			this.advance();
		}
		this.addToken("NUMBER", num);
	}

	private lexIdentifierValue(): void {
		let word = "";
		while (!this.hasEnded() && /[a-zA-Z0-9_]/.test(this.peek())) {
			word += this.peek();
			this.advance();
		}

		switch (word) {
			case "true":
			case "false":
				this.addToken("BOOLEAN", word);
				break;
			case "null":
				this.addToken("NULL", word);
				break;
			default:
				this.addToken("TEXT", word);
		}
	}

	private lexString(): void {
		const quote = this.peek();
		this.advance();

		let value = "";
		while (!this.hasEnded() && this.peek() !== quote) {
			if (this.peek() === "\\") {
				this.advance();
				value += this.peek();
			} else {
				value += this.peek();
			}
			this.advance();
		}

		this.advance();
		this.addToken("STRING", value);
	}

	private lexHeading(): void {
		let count = 0;
		while (this.peek(count) === "#") count++;
		this.addToken("HEADING", "#".repeat(count));
		this.advance(count);

		// Skip one space after the heading marker if present
		if (this.peek() === " ") {
			this.advance();
		}
	}

	private lexListMarker(): void {
		const marker = this.peek();
		this.addToken("LIST_MARKER", marker);
		this.advance();

		// Skip the space after the marker
		if (this.peek() === " ") {
			this.advance();

			// Check for task list markers: [ ] or [x]
			if (this.peek() === "[") {
				const nextChar = this.peek(1);
				const thirdChar = this.peek(2);
				if ((nextChar === " " || nextChar === "x") && thirdChar === "]") {
					this.addToken("TASK_MARKER", `[${nextChar}]`);
					this.advance(3); // consume [x] or [ ]
					if (this.peek() === " ") this.advance(); // consume space after marker
				}
			}
		}
	}

	private lexRule(): void {
		let count = 0;
		while (this.peek(count) === "-") count++;
		if (count >= 3) {
			this.addToken("RULE", "-".repeat(count));
			this.advance(count);
		} else {
			this.lexText();
		}
	}

	private lexComment(): void {
		// Skip the two dashes
		this.advance(2);

		// Skip one space if present
		if (this.peek() === " ") {
			this.advance();
		}

		// Collect comment text until newline
		let text = "";
		while (!this.hasEnded() && this.peek() !== "\n") {
			text += this.peek();
			this.advance();
		}

		this.addToken("COMMENT", text);
	}

	private lexCodeBlock(): void {
		this.addToken("CODE_START", "```");
		this.advance(3);

		// Parse language identifier
		let language = "";
		while (this.pos < this.input.length && this.peek() !== "\n") {
			language += this.peek();
			this.advance();
		}
		if (language) {
			this.addToken("CODE_LANG", language);
		}

		// Skip to next line
		if (this.peek() === "\n") {
			this.advance();
		}

		// Collect code content until closing backticks
		let content = "";
		while (!this.hasEnded() && !this.isCodeFence()) {
			content += this.peek();
			this.advance();
		}

		if (content) {
			content = content.trimEnd();
			this.addToken("CODE_CONTENT", content);
		}

		// Consume closing backticks
		if (this.isCodeFence()) {
			this.advance(3);
			this.addToken("CODE_END", "```");
		} else {
			throw new Error("Unclosed code block");
		}

		// Consume trailing newline if present
		if (this.peek() === "\n") {
			this.addToken("NEWLINE", "\n");
			this.advance();
		}
	}

	private lexEmphasisOrStrong(): void {
		const marker = this.peek();

		// Add the opening marker
		if (marker === "_") {
			this.addToken("EMPHASIS", marker);
		} else if (marker === "*") {
			this.addToken("STRONG", marker);
		}
		this.advance();

		// Collect text until closing marker
		let text = "";
		while (!this.hasEnded() && this.peek() !== marker) {
			if (this.peek() === " " || this.peek() === "\t") {
				if (text) {
					this.addToken("TEXT", text);
					text = "";
				}
				this.advance();
			} else {
				text += this.peek();
				this.advance();
			}
		}

		if (text) {
			this.addToken("TEXT", text);
		}

		// Add the closing marker
		if (this.peek() === marker) {
			if (marker === "_") {
				this.addToken("EMPHASIS", marker);
			} else if (marker === "*") {
				this.addToken("STRONG", marker);
			}
			this.advance();
		}
	}

	private lexInlineCode(): void {
		this.addToken("CODE_SINGLE", "`");
		this.advance();
	}

	private lexLinkOrFootnote(): void {
		// Collect text until closing bracket
		while (!this.hasEnded() && this.peek() !== "]") {
			if (this.peek() === "\\") {
				this.advance();
				this.addToken("TEXT", this.peek());
				this.advance();
			} else if (this.peek() !== " ") {
				let text = "";
				while (!this.hasEnded() && !["]", "\\", " "].includes(this.peek())) {
					text += this.peek();
					this.advance();
				}
				if (text) {
					this.addToken("TEXT", text);
				}
			} else {
				this.advance(); // Skip spaces
			}
		}

		if (this.peek() === "]") {
			this.addToken("LINK_TEXT_CLOSE", "]");
			this.advance();

			if (this.peek() === "(") {
				this.addToken("LINK_OPEN", "(");
				this.advance();

				// Collect URL until closing paren
				while (!this.hasEnded() && this.peek() !== ")") {
					if (this.peek() === "\\") {
						this.advance();
						this.addToken("TEXT", this.peek());
						this.advance();
					} else if (this.peek() !== " ") {
						let text = "";
						while (!this.hasEnded() && !["]", "\\", " ", ")"].includes(this.peek())) {
							text += this.peek();
							this.advance();
						}
						if (text) {
							this.addToken("TEXT", text);
						}
					} else {
						this.advance(); // Skip spaces
					}
				}

				if (this.peek() === ")") {
					this.addToken("LINK_CLOSE", ")");
					this.advance();

					// Skip any whitespace after the closing parenthesis
					while (this.peek() === " ") {
						this.advance();
					}
				}
			}
		}
	}

	private lexText(): void {
		// Skip pure whitespace at start of line
		if (this.isNewLine() && (this.peek() === " " || this.peek() === "\t")) {
			while (!this.hasEnded() && (this.peek() === " " || this.peek() === "\t")) {
				this.advance();
			}
			return;
		}

		// Handle regular inline text
		let text = "";
		const specialChars = ["#", "_", "*", "`", ">", "[", "|", ":", "\n", "-", "=", "(", ")"];

		while (!this.hasEnded() && !specialChars.includes(this.peek())) {
			text += this.peek();
			this.advance();
		}

		if (text) {
			this.addToken("TEXT", text);
		}
	}

	private seekBackUntilNonWhitespacePosition(): number {
		let i = this.tokens.length - 1;
		while (i >= 0) {
			const token = this.tokens[i];
			if (token.type === "WHITESPACE") i--;
			else return token.position.start;
		}
		// reached start of document
		return 0;
	}

	private isLineIndented(): boolean {
		const start = this.seekBackUntilNonWhitespacePosition();
		if (start === 0) return true;
		if (this.input[start] === "\n") return true;
		return false;
	}

	private isCodeFence(): boolean {
		return this.peek(0, 3) === "```";
	}

	private isComment(): boolean {
		return this.isNewLine() && this.peek() === "-" && this.peek(1) === "-";
	}

	private isRule(): boolean {
		return this.isNewLine() && this.peek() === "-" && this.peek(1) === "-" && this.peek(2) === "-";
	}

	private isNewLine(): boolean {
		return this.tokens.length === 0 || this.previous()?.type === "NEWLINE";
	}

	private isWhitespace(offset = 0): boolean {
		return this.peek(offset) === " " || this.peek(offset) === "\t";
	}

	private readTableAlignment(): Block.TableAlignment | null {
		if (this.previous()?.type !== "PIPE") return null;

		let offset = 0;

		while (this.isWhitespace(offset)) offset++;

		// Look for alignment row pattern: |:---:|

		// Skip initial colon
		const leftAlign = this.peek(offset) === ":";
		if (leftAlign) offset++;

		// Must have at least one dash
		if (this.peek(offset) !== "-") return null;

		// Skip dashes
		while (this.peek(offset) === "-") offset++;

		// Check for trailing colon
		const rightAlign = this.peek(offset) === ":";
		if (rightAlign) offset++;

		while (this.isWhitespace(offset)) offset++;

		// Must be followed by pipe or end of line
		if (this.peek(offset) !== "|" && this.peek(offset) !== "\n") return null;

		this.advance(offset);

		// Return alignment type
		if (leftAlign && rightAlign) return "center";
		if (rightAlign) return "right";
		if (leftAlign) return "left";
		return "left";
	}

	private hasEnded(): boolean {
		return this.pos >= this.input.length;
	}
}
