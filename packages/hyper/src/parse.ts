export type Attrs = {
	tag: string;
	id: string;
	class: string[];
};

const digits = new Set<string>(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);

export const parseSelector = (selector: string, { tagMode = false } = {}) => {
	selector = selector.trim();

	const attrs: Partial<Attrs> = { tag: undefined, id: undefined };
	const classlist = new Set<string>();

	let started = false,
		buffer = "",
		bufferType: keyof Attrs | "tag" | undefined = undefined;

	const flush = () => {
		if (buffer) {
			buffer = buffer.trim();
			if (bufferType)
				if (bufferType === "id" && attrs.id) throw new Error(`Cannot declare multiple IDs: ${attrs.id} ${buffer}`);
				else if (bufferType === "tag" || bufferType == "id") attrs[bufferType] = buffer;
				else classlist.add(buffer);
		}
		buffer = "";
		bufferType = undefined;
	};

	const update = (char: string, type?: keyof typeof attrs) => {
		// !buffer implies this is the first character of current match
		if (!buffer)
			if (char === "-" || char === "_" || digits.has(char))
				// if match starts with -_0-9, error
				throw new Error(`${bufferType || type} cannot start with char: ${char}`);

		buffer += char;
		if (type) bufferType = type;
	};

	for (const char of selector) {
		if (char === " ")
			if (bufferType === "id") update(char);
			else flush();
		else if (char === ".") flush(), (bufferType = "class");
		else if (char === "#") flush(), (bufferType = "id");
		else if (!started && char) update(char, tagMode ? "tag" : "class");
		else if (bufferType) update(char);
		else update(char, "class");

		started = true;
	}
	// attempt an update on end of string
	flush();

	attrs.class = [...classlist];

	if (!attrs.tag) {
		if (tagMode) attrs.tag = "div";
		else attrs.tag = "";
	}

	return attrs;
};
