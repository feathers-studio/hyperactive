import { preamble } from "./util/codegen.ts";

const rootUrl = "https://api.github.com/repos/mdn/content/contents/";

const elementsUrl = rootUrl + "files/en-us/web/html/element";

const opts = {
	headers: new Headers({
		Accept: "application/vnd.github.v3+json",
	}),
};

const baseType =
	"export type CustomTag = `${string}-${string}`;\n\n" +
	`export type Element =
	| CustomTag`;

const constructTypes = (elements: { title: string }[]) => {
	return (
		baseType +
		"\n\t| " +
		elements
			.sort((a, b) => a.title.localeCompare(b.title))
			.map(({ title }) => `"${title}"`)
			.join("\n\t| ") +
		";\n"
	);
};

fetch(elementsUrl, opts)
	.then(res => res.json())
	.then((elements: { name: string; path: string }[]) =>
		Promise.all(
			elements
				.filter(e => e.name !== "index.html")
				.map(element =>
					fetch(rootUrl + element.path + "/index.html", opts)
						.then(res => res.json())
						.then((file: { content: string }) => atob(file.content))
						.then((html: string) => {
							const [line1, ...rest] = html
								.split("\n")
								.reduce(
									(acc, curr, i) => {
										if (!acc.seen) acc.arr.push(curr);
										if (i !== 0 && curr === "---") {
											acc.seen = true;
										}

										return acc;
									},
									{ seen: false, arr: [] as string[] },
								)
								.arr.slice(1, -1);

							const title = line1.replace(/^title: '?</, "").replace(/>.*$/, "");

							const deprecated = rest.some(line => line.includes("Deprecated"));

							return { title, deprecated };
						}),
				),
		),
	)
	.then(elements => {
		const active = elements
			.filter(e => !e.deprecated)
			.concat(
				["h2", "h3", "h4", "h5", "h6", "svg", "math"].map(title => ({
					title,
					deprecated: false,
				})),
			);

		Deno.writeTextFileSync("./src/lib/elements.ts", preamble + constructTypes(active));
	});
