"use strict";
const htmlparser = window.htmlparser2;

const html2hyperscript = (input, stream) => {
	let indentLevel = 0;
	let attrOpen = false;
	let justClosed = false;
	let size = 0;
	const streamWrite = stream.write;
	stream.write = (...chunk) => ((size += chunk.length), streamWrite(...chunk));

	const parser = new htmlparser.Parser(
		{
			onopentag(name, attr) {
				if (justClosed) {
					justClosed = false;
				}
				stream.write("\n" + "\t".repeat(indentLevel++) + `${name}`);
				let attrKeys = Object.keys(attr);
				if (attrKeys.length) {
					let selector = "";
					if (attr.id) selector += "#" + attr.id.split(" ").join("#");
					if (attr.class) selector += "." + attr.class.split(" ").join(".");
					if (selector) stream.write(`["${selector}"]`);
					stream.write("(");

					attrKeys = attrKeys.filter(name => !["class", "id"].includes(name));
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
					comments.split("\n").forEach(comment =>
						stream.write(
							"\n// " + "\t".repeat(indentLevel) + comment.trim(),
							// Strip whitespace and prepend ; to every line of comment
						),
					);
			},

			ontext(text) {
				if (!text.trim()) return;
				if (attrOpen) attrOpen = false;
				justClosed = false;
				stream.write(`\`${text.replace(/`/g, String.raw`\``)}\``);
			},

			onclosetag() {
				if (justClosed) stream.pop();
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
	return stream;
};

window.compile = html2hyperscript;
