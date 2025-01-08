import { HypermarkDocument } from "./types.ts";
import { limited_log } from "./common.ts";
import { ParserContext } from "./Context.ts";
import { parse_blocks } from "./block.ts";
export interface ParseOptions {
	filename?: string;
	tab_size?: number;
}

export function parse(input: string, options?: ParseOptions) {
	const doc = new HypermarkDocument([]);
	const ctx = new ParserContext(input, doc, options);
	// @ts-expect-error normalise decorators after parsing
	doc.blocks = parse_blocks(ctx, true);
	return doc;
}
