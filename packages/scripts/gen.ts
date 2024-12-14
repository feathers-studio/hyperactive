import { fetchGlobalAttributes } from "./fetchGlobalAttributes.ts";
import { fetchAttributes } from "./fetchAttributes.ts";
import { fetchARIA } from "./fetchARIA.ts";
import { fetchTags } from "./fetchTags.ts";
// import { domlib } from "./domlib.ts";

import { join } from "node:path";
import { collect } from "./util/hypertyper.ts";

const requested = Bun.argv[2]?.split(",") || ["aria", "attributes", "global-attributes", "tags", "dom"];

async function writeAll(target: string, generator: Generator<string> | AsyncGenerator<string>) {
	const file = Bun.file(target);
	const writer = file.writer();
	for await (const chunk of generator) await writer.write(collect(chunk));
	await writer.flush();
}

const root = join(import.meta.dir, "../hyper/lib/");

if (requested.includes("global-attributes")) {
	const target = join(root, "global-attributes.ts");
	console.log(`Writing ${target}`);
	await writeAll(target, fetchGlobalAttributes());
}

if (requested.includes("attributes")) {
	const target = join(root, "attributes.ts");
	console.log(`Writing ${target}`);
	await writeAll(target, fetchAttributes());
}

if (requested.includes("aria")) {
	const target = join(root, "aria.ts");
	console.log(`Writing ${target}`);
	await writeAll(target, fetchARIA());
}

if (requested.includes("tags")) {
	for await (const out of fetchTags()) {
		const { file, content } = out;
		const target = join(root, file);
		console.log(`Writing ${target}`);
		await writeAll(target, content);
	}
}
