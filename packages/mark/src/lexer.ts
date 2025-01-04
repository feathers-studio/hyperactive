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
	| "PIPE"
	| "COMMENT"
	| "QUOTE_MARKER";

type InlineTokenType =
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
		this.tokens.push({
			type,
			value,
			position: {
				start: this.pos,
				end: this.pos + length,
				line: this.line,
				column: this.column,
			},
		});
	}

	public tokenize(): Token[] {
		while (!this.hasEnded()) {
			const char = this.peek();

			// Check if we're in call parameter context
			const lastToken = this.tokens[this.tokens.length - 1];
			const isInCallContext =
				lastToken && (lastToken.type === "PAREN_OPEN" || lastToken.type === "COMMA" || lastToken.type === "COLON");

			// console.log("---");
			// console.log(this.input);
			// console.log(this.pos, this.line, this.column);
			// console.log(this.tokens.length, { previous: this.previous()?.type, peek: this.peek() });

			switch (char) {
				case "=":
					if (this.isNewLine()) {
						this.lexCall();
					} else {
						this.lexText();
					}
					break;
				case "(":
					this.addToken("PAREN_OPEN", "(");
					this.advance();
					break;
				case ")":
					this.addToken("PAREN_CLOSE", ")");
					this.advance();
					break;
				case ":":
					this.addToken("COLON", ":");
					this.advance();
					break;
				case ",":
					this.addToken("COMMA", ",");
					this.advance();
					break;
				case '"':
				case "'":
					if (isInCallContext) {
						this.lexString();
					} else {
						this.lexText();
					}
					break;
				case "#":
					this.lexHeading();
					break;
				case "_":
					this.lexEmphasisOrStrong();
					break;
				case "*":
					if (this.isListMarker()) {
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
					} else if (this.isListMarker()) {
						this.lexListMarker();
					} else {
						this.lexText();
					}
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
				case "|":
					this.lexTablePipe();
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
			this.addToken("NEWLINE", "\n");
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

	private lexQuote(): void {
		this.addToken("QUOTE", ">");
		this.advance();
		if (this.peek() === " ") {
			this.advance();
		}
	}

	private lexTablePipe(): void {
		this.addToken("PIPE", "|");
		this.advance();
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
		const specialChars = ["#", "*", "`", ">", "[", "|", "\n", "-", "=", "(", ")"];

		while (!this.hasEnded() && !specialChars.includes(this.peek())) {
			text += this.peek();
			this.advance();
		}

		if (text) {
			this.addToken("TEXT", text);
		}
	}

	private isListMarker(): boolean {
		// Check if at start of line
		if (this.isNewLine()) {
			return true;
		}

		// Look backwards through tokens until we find non-whitespace
		let i = this.tokens.length - 1;
		while (i >= 0) {
			const token = this.tokens[i];
			if (token.type === "NEWLINE") return true;
			if (token.type === "TEXT") {
				// If the text is all whitespace, keep looking back
				if (!/^\s+$/.test(token.value)) {
					return false;
				}
			} else {
				return false;
			}
			i--;
		}

		// If we get here, we're at the start of the document
		return true;
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

	private hasEnded(): boolean {
		return this.pos >= this.input.length;
	}
}
