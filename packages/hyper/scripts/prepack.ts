/// <reference types="@types/bun" />
import { join } from "node:path";
import rcompare from "semver/functions/rcompare";

const pkg = Bun.file(join(import.meta.dir, "../package.json"));
const pkgJson = await pkg.json();
const hyperVersion = pkgJson.version;
const typesWebVersion = pkgJson.peerDependencies["@types/web"];

if (typeof hyperVersion !== "string") {
	throw new Error("Failed to find Hyperactive version in package.json. Check scripts/prepack.ts");
}

if (typeof typesWebVersion !== "string") {
	throw new Error("Failed to find @types/web version in package.json. Check scripts/prepack.ts");
}

const promptfree = Bun.argv.includes("--yes") || Bun.argv.includes("-y");

if (!promptfree) {
	console.log(`Hyperactive ${hyperVersion} requires @types/web ${typesWebVersion}.`);

	const answer = await prompt("Update README.md and docs/versions.md? (Y/n)");

	if (answer === "n") {
		console.log("Skipping");
		process.exit(0);
	}
}

{
	const readme = Bun.file(join(import.meta.dir, "../../../README.md"));
	const readmeText = await readme.text();

	// match ![Hyperactive Version 2.0.0-beta.1]
	const oldVersion = readmeText.match(/!\[Hyperactive Version (?<version>.+?)\]/)?.groups?.version;
	if (!oldVersion) {
		throw new Error("Failed to find old Hyperactive version in README.md. Check scripts/postinstall.ts");
	}

	const oldTypesWebVersion = readmeText.match(/!\[@types\/web (?<version>.+?)\]/)?.groups?.version;
	if (!oldTypesWebVersion) {
		throw new Error("Failed to find old @types/web version in README.md. Check scripts/postinstall.ts");
	}

	console.log();
	console.log("Updating README.md");
	console.log(`Hyperactive from ${oldVersion} to ${hyperVersion}`);
	console.log(`@types/web from ${oldTypesWebVersion} to ${typesWebVersion}`);
	console.log();

	const newReadme = readmeText.replaceAll(oldVersion, hyperVersion).replaceAll(oldTypesWebVersion, typesWebVersion);
	await readme.writer().write(newReadme);

	await Bun.write(join(import.meta.dir, "../README.md"), newReadme);
}

{
	const versions = Bun.file(join(import.meta.dir, "../../../docs/versions.md"));
	const versionsText = await versions.text();

	// parse all table rows
	let versionsRows = (versionsText.match(/^\| (.*) \| (.*) \|$/gm)?.slice(2) ?? []).map(row => {
		const [hyper, types] = row
			.split("|")
			.slice(1, 3)
			.map(cell => cell.trim());
		return { hyper, types };
	});

	versionsRows = versionsRows.filter(row => row.hyper !== hyperVersion);
	versionsRows.push({ hyper: hyperVersion, types: typesWebVersion });
	versionsRows.sort((a, b) => rcompare(a.hyper, b.hyper));

	const newVersions = versionsRows.map(row => `| ${row.hyper} | ${row.types} |`).join("\n");

	await Bun.write(versions, "");
	// replace everything after | ------------------- | ------------------ |
	const MARKER = "| ------------------- | ------------------ |";
	const indexOfMarker = versionsText.indexOf(MARKER);
	const newVersionsText = versionsText.slice(0, indexOfMarker) + MARKER + "\n" + newVersions;
	await versions.writer().write(newVersionsText);
}
