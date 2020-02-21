"use strict";
const htmlparser = window.htmlparser2;

const html2hyperscript = (input, stream) => {
	const elements = new Set();
	let indentLevel = 0;
	let attrOpen = false;
	let textWritten = false;
	let justClosed = false;
	let size = 0;
	const streamWrite = stream.write;
	stream.write = (...chunk) => ((size += chunk.length), streamWrite(...chunk));

	const parser = new htmlparser.Parser(
		{
			onopentag(name, attr) {
				elements.add(name);
				if (justClosed) {
					justClosed = false;
				}
				if (textWritten) {
					stream.write(", ");
					textWritten = false;
				}
				if (attrOpen) attrOpen = false;
				stream.write("\n" + "\t".repeat(indentLevel++) + `${name}`);
				let attrKeys = Object.keys(attr);
				if (attrKeys.length) {
					let selector = "";
					if (attr.id) selector += "#" + attr.id.split(" ").join("#");
					if (attr.class) selector += "." + attr.class.split(" ").join(".");
					if (selector) stream.write(`["${selector}"]`);
					stream.write("(");

					delete attr.class;
					delete attr.id;

					attrKeys = Object.keys(attr);
					if (attrKeys.length) {
						stream.write(JSON.stringify(attr), ", ");
						attrOpen = true;
					}
				} else {
					stream.write("(");
				}
			},

			oncomment(comments) {
				justClosed = false;
				(comments = comments.trim()) &&
					comments
						.split("\n")
						.forEach(comment =>
							stream.write("\n// " + "\t".repeat(indentLevel) + comment.trim()),
						);
			},

			ontext(text) {
				if (!text.trim()) return;
				if (textWritten) {
					stream.write(", ");
					textWritten = false;
				}
				if (attrOpen) attrOpen = false;
				justClosed = false;
				const escapedTick = String.raw`\``;
				text = text.replace(/`/g, escapedTick);
				stream.write(`m.trust(String.raw\`${text}\`)`);
				textWritten = true;
			},

			onclosetag() {
				if (justClosed) stream.pop();
				if (textWritten) {
					textWritten = false;
				}
				if (attrOpen) {
					stream.pop();
					stream.pop();
					attrOpen = false;
				}
				justClosed = true;
				stream.write("),");
				indentLevel--;
			},

			onend() {
				if (justClosed) stream.pop();
				if (size) stream.write(";\n");
				stream.end();
			},
		},
		{ decodeEntities: true },
	);

	parser.write(input);
	parser.end();
	return { elements, stream };
};

window.compile = html2hyperscript;
