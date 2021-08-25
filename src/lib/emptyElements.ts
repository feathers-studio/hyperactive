import { unionFromSet } from "../util.ts";

export const EmptyElements = new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr",
] as const);

export type EmptyElements = unionFromSet<typeof EmptyElements>;
