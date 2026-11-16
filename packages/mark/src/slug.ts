/**
 * Characters a heading's id leaves out. github-slugger's rule, so `[x](#a-heading)` reaches the
 * same heading on GitHub and here. github-slugger lists its characters for one Unicode version;
 * written with properties, letters added to Unicode since are kept rather than dropped.
 */
const removed = /[^\p{Alphabetic}\p{M}\p{Nd}\p{Pc} -]/gu;

/** Ids for one document's headings: lowercase, spaces as hyphens, and a repeat numbered. */
export function slugger(): (text: string) => string {
	const occurrences = new Map<string, number>();

	return text => {
		const original = text.toLowerCase().replace(removed, "").replaceAll(" ", "-");
		let slug = original;
		// As github-slugger counts: a repeated "a" is "a-1", and a heading "a-1" after it is "a-1-1".
		while (occurrences.has(slug)) {
			const count = occurrences.get(original)! + 1;
			occurrences.set(original, count);
			slug = `${original}-${count}`;
		}
		occurrences.set(slug, 0);
		return slug;
	};
}
