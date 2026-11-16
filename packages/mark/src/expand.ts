import type { Block, HypermarkDocument, Position, Value } from "./types.ts";
import { std } from "./std.ts";

/**
 * A function a call expands to: `=name(first, key: value)` runs
 * `name(first, { key: value }, context)`, and what it returns replaces the call.
 *
 * Macros produce Hypermark, not output, so one written once works in every renderer.
 */
export type Macro = (
	first: Value | undefined,
	named: Record<string, Value>,
	context: ExpandContext,
) => Block | Block[] | Promise<Block | Block[]>;

export interface ExpandContext {
	/** The call being expanded. */
	call: Block.Call;
	/** The path from the project root that a URL in this document points at, if it is inside. */
	path(url: string): string | undefined;
	/** The text of the file a URL in this document points at, or undefined. */
	read(url: string): Promise<string | undefined>;
	/** Record a problem with this call. Expansion carries on. */
	report(message: string, hint?: string): void;
}

export interface ExpandOptions {
	/** Loads a file by its path from the project root, or returns undefined. */
	read(path: string): Promise<string | undefined>;
	/** This document's path from the project root, which relative URLs resolve against. */
	filename?: string;
	/** Added to `std`, replacing any of the same name. */
	macros?: Record<string, Macro>;
}

/** Something wrong with a document, found while expanding or rendering it. */
export interface Problem {
	message: string;
	hint?: string;
	/**
	 * Where the node was written. A node a macro returned has the position of the call
	 * that macro expanded, so a problem always points at something in the file.
	 */
	position?: Position;
}

/** How deep a macro's result may itself expand: far beyond any real use, short of a hang. */
const DEPTH_LIMIT = 16;

/**
 * Replace every call that names a macro with what the macro returns.
 *
 * Calls naming no macro are left for the renderer. A macro that throws becomes a
 * problem and its call stays, so one broken call does not cost the whole document.
 */
export async function expand(doc: HypermarkDocument, options: ExpandOptions): Promise<Problem[]> {
	const macros = { ...std, ...options.macros };
	const filename = (options.filename ?? "").replaceAll("\\", "/");

	// A page quoting five regions of one example reads it once.
	const reads = new Map<string, Promise<string | undefined>>();
	const read = (path: string) => {
		let text = reads.get(path);
		if (text === undefined) reads.set(path, (text = options.read(path)));
		return text;
	};

	type Expanded = { blocks: Block[]; problems: Problem[] };

	async function expand_blocks(blocks: Block[], depth: number): Promise<Expanded> {
		// In parallel, since a reader may fetch over the network; problems keep document order.
		const results = await Promise.all(blocks.map(block => expand_block(block, depth)));
		return {
			blocks: results.flatMap(result => result.blocks),
			problems: results.flatMap(result => result.problems),
		};
	}

	async function expand_inside(block: Block, depth: number): Promise<Problem[]> {
		const problems: Problem[] = [];
		const inner = async (blocks: Block[]) => {
			const result = await expand_blocks(blocks, depth);
			problems.push(...result.problems);
			return result.blocks;
		};
		if (block.type === "quote") block.content = await inner(block.content);
		else if (block.type === "decorator") block.blocks = await inner(block.blocks);
		else if (block.type === "list") {
			for (const item of block.items) item.content = await inner(item.content);
		}
		return problems;
	}

	async function expand_block(block: Block, depth: number): Promise<Expanded> {
		if (block.type !== "call") return { blocks: [block], problems: await expand_inside(block, depth) };

		// Own properties only: `=constructor()` must not find Object.prototype.constructor.
		const macro = Object.hasOwn(macros, block.name) ? macros[block.name] : undefined;
		if (macro === undefined) return { blocks: [block], problems: [] };

		const problems: Problem[] = [];
		const report = (message: string, hint?: string) => {
			problems.push({
				message,
				...(hint ? { hint } : {}),
				...(block.position ? { position: block.position } : {}),
			});
		};

		if (depth >= DEPTH_LIMIT) {
			report(`\`${block.name}\` expands into itself too deeply`, "A macro may be returning its own call.");
			return { blocks: [block], problems };
		}

		// No syntax produces a call as a parameter value, so every value here is a Value.
		const values = block.parameters.parameters;
		const first = values.find(p => p.name === "__default")?.value as Value | undefined;
		const named: Record<string, Value> = {};
		for (const p of values) if (p.name !== "__default") named[p.name] = p.value as Value;

		const context: ExpandContext = {
			call: block,
			path: url => resolve_path(filename, url),
			read: async url => {
				const path = resolve_path(filename, url);
				return path === undefined ? undefined : read(path);
			},
			report,
		};

		let result: Block | Block[];
		try {
			result = await macro(first, named, context);
		} catch (error) {
			report(`\`${block.name}\` failed: ${(error as Error).message}`);
			return { blocks: [block], problems };
		}

		// What a macro made was written nowhere; it stands where the call was written. That
		// keeps a later problem with it — a twoslash error in an expanded `=code()` — in the file.
		const produced = Array.isArray(result) ? result : [result];
		if (block.position) for (const node of produced) node.position ??= block.position;

		// What a macro returns may hold calls of its own.
		const expanded = await expand_blocks(produced, depth + 1);
		return { blocks: expanded.blocks, problems: [...problems, ...expanded.problems] };
	}

	const result = await expand_blocks(doc.blocks, 0);
	doc.blocks = result.blocks;
	return result.problems;
}

/**
 * A URL resolved against the document's own path, as a path from the project root.
 *
 * Undefined for anything outside the project — above its root, or with a scheme — so
 * a reader is never asked for a file it should not hand over.
 */
function resolve_path(filename: string, url: string): string | undefined {
	if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return undefined;

	const parts = url.startsWith("/") ? [] : filename.split("/").slice(0, -1);
	for (const segment of url.split("/")) {
		if (segment === "" || segment === ".") continue;
		if (segment !== "..") parts.push(segment);
		else if (parts.pop() === undefined) return undefined;
	}
	return parts.length ? parts.join("/") : undefined;
}
