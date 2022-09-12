const escapables = {
	"&lt;": "<",
	"&gt;": ">",
	"&amp;": "&",
	"&#39;": "'",
	"&quot;": '"',
};

const escaped = new RegExp(Object.keys(escapables).join("|"), "g");

export const escapeAttr = (s: string) => s.replace(escaped, r => escapables[r as keyof typeof escapables] || r);

export const html2md = (html: string, { baseURL }: { baseURL?: string } = {}) =>
	escapeAttr(
		html
			.replace(/<code>(?<contents>.+?)<\/code>/g, (_, _1, _2, _3, { contents }) => contents)
			.replace(/<strong>(?<contents>.+?)<\/strong>/g, (_, _1, _2, _3, { contents }) => `**${contents}**`)
			.replace(
				/<a href="(?<href>.+?)">(?<contents>.+?)<\/a>/g,
				(_, _1, _2, _3, _4, { contents, href }) => `[${contents}](${new URL(href, baseURL).toString()})`,
			),
	);
