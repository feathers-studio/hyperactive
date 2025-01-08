export class ParseError extends Error {
	constructor(
		public index: number,
		public line: number,
		public column: number,
		message: string,
		public filename?: string,
	) {
		super(message);
		this.name = "ParseError";
	}
}

export class DecoratorStartMarker {
	type: "decorator-start" = "decorator-start";
	toString(): string {
		return ">";
	}
}

export class DecoratorEndMarker {
	type: "decorator-end" = "decorator-end";
	toString(): string {
		return "<@";
	}
}

export const count_char = (input: string, char: string, from: number, to: number) => {
	let count = 0;
	let last_index = -1;
	for (let i = from; i < to; i++) {
		if (input[i] === char) {
			count++;
			last_index = i - from;
		}
	}
	return { count, last_index };
};

export const normal_line_number = (line_number: number) => {
	let num = line_number.toString();
	if (num.length > 3) num = "-" + num.slice(-3);
	else if (num.length < 4) num = num.padStart(4, " ");
	return num;
};

export const get_line_neighbours = (
	input: string,
	line_number: number,
	count: number = 5,
): string[] => {
	const lines = input.split("\n");
	return lines
		.slice(Math.max(0, line_number - count), line_number)
		.map((line, i) => `${normal_line_number(line_number - count + i)} | ${line}`);
};

export const limited_log = (n: number) => {
	return (...args: any[]) => {
		if (n > 0) {
			console.log(...args);
			n--;
		}
	};
};
