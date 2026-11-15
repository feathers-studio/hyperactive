/**
 * `#region` / `#endregion` extraction, for `=code(…, region: "name")`.
 *
 * The markers are VS Code's own folding syntax, so they are useful to someone reading
 * the example file in an editor, not only to Hypermark. Line ranges are not supported:
 * they stay correct only until someone edits the file above them.
 *
 * The comment leader is whatever the language uses, so one implementation serves
 * `.ts`, `.sh`, `.css` and `.sql` alike.
 */
const START = /^[ \t]*(?:\/\/|#|\/\*|\*|--|;)[ \t]*#region[ \t]+(\S+)/;
const END = /^[ \t]*(?:\/\/|#|\/\*|\*|--|;)[ \t]*#endregion\b/;
const MARKER = /^[ \t]*(?:\/\/|#|\/\*|\*|--|;)[ \t]*#(?:end)?region\b/;

/** A `#region` or `#endregion` line, which is scaffolding and never shown. */
export function is_marker(line: string): boolean {
	return MARKER.test(line);
}

export interface Region {
	/** The region's lines, markers removed and common indentation stripped. */
	text: string;
	/** 0-based index of the region's first line in the file. */
	start: number;
	/** 0-based index of its `#endregion` line, so `start` to `end` is exclusive. */
	end: number;
}

export type RegionResult =
	| { ok: true; region: Region }
	| { ok: false; reason: "missing"; names: string[] }
	| { ok: false; reason: "unterminated" }
	| { ok: false; reason: "duplicate" };

/** Every region name the file declares, in order, so a problem can suggest one. */
export function region_names(source: string): string[] {
	const names: string[] = [];
	for (const line of source.split("\n")) {
		const match = START.exec(line);
		if (match) names.push(match[1]!);
	}
	return names;
}

export function read_region(source: string, name: string): RegionResult {
	const lines = source.split("\n");

	const declared = lines.filter(line => START.exec(line)?.[1] === name).length;
	if (declared === 0) return { ok: false, reason: "missing", names: region_names(source) };
	// Two regions of one name would make `region: "x"` mean whichever came first.
	if (declared > 1) return { ok: false, reason: "duplicate" };

	let start = -1;
	// A region may contain regions; without the depth, the first nested `#endregion`
	// would close the outer one.
	let depth = 0;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		if (start === -1) {
			if (START.exec(line)?.[1] === name) {
				start = i + 1;
				depth = 1;
			}
			continue;
		}
		if (START.test(line)) depth++;
		else if (END.test(line) && --depth === 0) {
			const body = lines.slice(start, i).filter(l => !is_marker(l));
			return { ok: true, region: { text: dedent(trim_blank(body)).join("\n"), start, end: i } };
		}
	}
	return { ok: false, reason: "unterminated" };
}

/** Blank lines against the markers are framing, not content. */
function trim_blank(lines: string[]): string[] {
	let from = 0;
	let to = lines.length;
	while (from < to && lines[from]!.trim() === "") from++;
	while (to > from && lines[to - 1]!.trim() === "") to--;
	return lines.slice(from, to);
}

/**
 * Strip the indentation a region has only because of where it sits in the file.
 *
 * Measured in characters, not columns: a block mixing tabs and spaces has a problem
 * Hypermark should not try to interpret.
 */
export function dedent(lines: string[]): string[] {
	let common: string | undefined;
	for (const line of lines) {
		if (line.trim() === "") continue;
		const indent = /^[ \t]*/.exec(line)![0];
		if (common === undefined) common = indent;
		else {
			let i = 0;
			while (i < common.length && i < indent.length && common[i] === indent[i]) i++;
			common = common.slice(0, i);
		}
		if (common === "") break;
	}
	const width = common?.length ?? 0;
	return width === 0 ? lines : lines.map(line => (line.trim() === "" ? "" : line.slice(width)));
}
