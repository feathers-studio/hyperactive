import { fetchGlobalAttributes } from "./fetchGlobalAttributes.ts";
import { fetchAttributes } from "./fetchAttributes.ts";
import { fetchARIA } from "./fetchARIA.ts";
import { fetchTags } from "./fetchTags.ts";
import { domlib } from "./domlib.ts";

import { join } from "node:path";

const requested = Bun.argv[2]?.split(",") || ["aria", "attributes", "global-attributes", "tags", "dom"];

async function writeTo(target: string, generator: Generator<string> | AsyncGenerator<string>) {
	// Truncate the file first
	await Bun.write(target, "");

	const file = Bun.file(target);
	const writer = file.writer();
	for await (const chunk of generator) {
		let written = 0;
		while (written < chunk.length) {
			written += await writer.write(chunk.slice(written));
		}
	}
	await writer.write("\n");
	await writer.end();
}

const root = join(import.meta.dir, "../hyper/src/lib/");

if (requested.includes("global-attributes")) {
	const target = join(root, "global-attributes.ts");
	console.log(`Writing ${target}`);
	await writeTo(target, fetchGlobalAttributes());
}

if (requested.includes("attributes")) {
	const target = join(root, "attributes.ts");
	console.log(`Writing ${target}`);
	await writeTo(target, fetchAttributes());
}

if (requested.includes("aria")) {
	const target = join(root, "aria.ts");
	console.log(`Writing ${target}`);
	await writeTo(target, fetchARIA());
}

if (requested.includes("tags")) {
	for await (const out of fetchTags()) {
		const { file, content } = out;
		const target = join(root, file);
		console.log(`Writing ${target}`);
		await writeTo(target, content());
	}
}

if (requested.includes("dom")) {
	const target = join(root, "../vendor/dom.slim.ts");
	console.log(`Writing ${target}`);
	await writeTo(target, domlib());
}
