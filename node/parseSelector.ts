type attrs = {
	tag?: string;
	id?: string;
	class?: string[];
};

export const parseSelector = (selector: string) => {
	selector = selector.trim();

	const attrs: attrs = { tag: undefined, id: undefined };
	const classlist = new Set<string>();

	let started = false,
		buffer = "",
		bufferType: keyof attrs | undefined = undefined;

	const flush = () => {
		if (buffer) {
			buffer = buffer.trim();
			if (bufferType) {
				if (bufferType === "id" && attrs.id)
					throw new Error(`Cannot declare multiple IDs: ${attrs.id} ${buffer}`);
				if (bufferType === "tag" || bufferType == "id")
					attrs[bufferType] = buffer;
				else classlist.add(buffer);
			}
		}
		buffer = "";
		bufferType = undefined;
	};

	for (const char of selector) {
		if (char === " ") {
			if (bufferType === "id") {
				buffer += char;
			} else {
				flush();
			}
		} else if (char === "." || char === "#") {
			flush();

			if (char === ".") {
				bufferType = "class";
			} else if (char === "#") {
				bufferType = "id";
			}
		} else if (!started && char) {
			bufferType = "tag";
			buffer += char;
		} else if (bufferType) {
			buffer += char;
		} else {
			buffer += char;
			bufferType = "class";
		}

		started = true;
	}
	// on end of string, attempt an update
	flush();

	attrs.class = [...classlist];

	return attrs;
};
