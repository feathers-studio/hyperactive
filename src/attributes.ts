import { Element } from "./elements.ts";
import { AriaRoles, AriaAttributes } from "./aria.ts";

type GlobalAttrs = Record<
	| "accesskey"
	| "autocapitalize"
	| "class"
	| "contenteditable"
	| "contextmenu"
	| "dir"
	| "draggable"
	| "hidden"
	| "id"
	| "itemprop"
	| "lang"
	| "slot"
	| "spellcheck"
	| "style"
	| "tabindex"
	| "title"
	| "translate",
	string
>;

type ElementAttrs = {
	a: Record<
		| "download"
		| "href"
		| "hreflang"
		| "media"
		| "ping"
		| "referrerpolicy"
		| "rel"
		| "shape"
		| "target",
		string
	>;
	applet: Record<"align" | "alt" | "code" | "codebase", string>;
	area: Record<
		| "alt"
		| "coords"
		| "download"
		| "href"
		| "hreflang"
		| "media"
		| "ping"
		| "referrerpolicy"
		| "rel"
		| "shape"
		| "target",
		string
	>;
	audio: Record<
		| "autoplay"
		| "buffered"
		| "controls"
		| "crossorigin"
		| "loop"
		| "muted"
		| "preload"
		| "src",
		string
	>;
	base: Record<"href" | "target", string>;
	basefont: Record<"color", string>;
	bgsound: Record<"loop", string>;
	blockquote: Record<"cite", string>;
	body: Record<"background" | "bgcolor", string>;
	button: Record<
		| "autofocus"
		| "disabled"
		| "form"
		| "formaction"
		| "formenctype"
		| "formmethod"
		| "formnovalidate"
		| "formtarget"
		| "name"
		| "type"
		| "value",
		string
	>;
	canvas: Record<"height" | "width", string>;
	caption: Record<"align", string>;
	col: Record<"align" | "bgcolor" | "span", string>;
	colgroup: Record<"align" | "bgcolor" | "span", string>;
	command: Record<
		"checked" | "disabled" | "icon" | "radiogroup" | "type",
		string
	>;
	contenteditable: Record<"enterkeyhint" | "inputmode", string>;
	data: Record<"value", string>;
	del: Record<"cite" | "datetime", string>;
	details: Record<"open", string>;
	embed: Record<"height" | "src" | "type" | "width", string>;
	fieldset: Record<"disabled" | "form" | "name", string>;
	font: Record<"color", string>;
	form: Record<
		| "accept"
		| "accept-charset"
		| "action"
		| "autocomplete"
		| "enctype"
		| "method"
		| "name"
		| "novalidate"
		| "target",
		string
	>;
	hr: Record<"align" | "color", string>;
	iframe: Record<
		| "align"
		| "allow"
		| "csp"
		| "height"
		| "importance"
		| "loading"
		| "name"
		| "referrerpolicy"
		| "sandbox"
		| "src"
		| "srcdoc"
		| "width",
		string
	>;
	img: Record<
		| "align"
		| "alt"
		| "border"
		| "crossorigin"
		| "decoding"
		| "height"
		| "importance"
		| "ismap"
		| "loading"
		| "referrerpolicy"
		| "sizes"
		| "src"
		| "srcset"
		| "usemap"
		| "width",
		string
	>;
	input: Record<
		| "accept"
		| "alt"
		| "autocomplete"
		| "autofocus"
		| "capture"
		| "checked"
		| "dirname"
		| "disabled"
		| "form"
		| "formaction"
		| "formenctype"
		| "formmethod"
		| "formnovalidate"
		| "formtarget"
		| "height"
		| "list"
		| "max"
		| "maxlength"
		| "min"
		| "minlength"
		| "multiple"
		| "name"
		| "pattern"
		| "placeholder"
		| "readonly"
		| "required"
		| "size"
		| "src"
		| "step"
		| "type"
		| "usemap"
		| "value"
		| "width",
		string
	>;
	ins: Record<"cite" | "datetime", string>;
	keygen: Record<
		"autofocus" | "challenge" | "disabled" | "form" | "keytype" | "name",
		string
	>;
	label: Record<"for" | "form", string>;
	li: Record<"value", string>;
	link: Record<
		| "crossorigin"
		| "href"
		| "hreflang"
		| "importance"
		| "integrity"
		| "media"
		| "referrerpolicy"
		| "rel"
		| "sizes",
		string
	>;
	map: Record<"name", string>;
	marquee: Record<"bgcolor" | "loop", string>;
	menu: Record<"type", string>;
	meta: Record<"charset" | "content" | "http-equiv" | "name", string>;
	meter: Record<
		"form" | "high" | "low" | "max" | "min" | "optimum" | "value",
		string
	>;
	object: Record<
		| "border"
		| "data"
		| "form"
		| "height"
		| "name"
		| "type"
		| "usemap"
		| "width",
		string
	>;
	ol: Record<"reversed" | "start", string>;
	optgroup: Record<"disabled" | "label", string>;
	option: Record<"disabled" | "label" | "selected" | "value", string>;
	output: Record<"for" | "form" | "name", string>;
	param: Record<"name" | "value", string>;
	progress: Record<"form" | "max" | "value", string>;
	q: Record<"cite", string>;
	script: Record<
		| "async"
		| "charset"
		| "crossorigin"
		| "defer"
		| "importance"
		| "integrity"
		| "referrerpolicy"
		| "src"
		| "type",
		string
	>;
	select: Record<
		| "autocomplete"
		| "autofocus"
		| "disabled"
		| "form"
		| "multiple"
		| "name"
		| "required"
		| "size",
		string
	>;
	source: Record<"media" | "sizes" | "src" | "srcset" | "type", string>;
	style: Record<"media" | "type", string>;
	table: Record<"align" | "background" | "bgcolor" | "border", string>;
	tbody: Record<"align" | "bgcolor", string>;
	td: Record<
		"align" | "background" | "bgcolor" | "colspan" | "headers" | "rowspan",
		string
	>;
	textarea: Record<
		| "autocomplete"
		| "autofocus"
		| "cols"
		| "dirname"
		| "disabled"
		| "enterkeyhint"
		| "form"
		| "inputmode"
		| "maxlength"
		| "minlength"
		| "name"
		| "placeholder"
		| "readonly"
		| "required"
		| "rows"
		| "wrap",
		string
	>;
	tfoot: Record<"align" | "bgcolor", string>;
	th: Record<
		| "align"
		| "background"
		| "bgcolor"
		| "colspan"
		| "headers"
		| "rowspan"
		| "scope",
		string
	>;
	thead: Record<"align", string>;
	time: Record<"datetime", string>;
	tr: Record<"align" | "bgcolor", string>;
	track: Record<"default" | "kind" | "label" | "src" | "srclang", string>;
	video: Record<
		| "autoplay"
		| "buffered"
		| "controls"
		| "crossorigin"
		| "height"
		| "loop"
		| "muted"
		| "poster"
		| "preload"
		| "src"
		| "width",
		string
	>;
	[k: string]: unknown;
};

export type DataAttr = `data-${string}`;

export type Attr<E extends Element = Element> =
	// TODO(mkr): will work in TS 4.4
	// { [data in DataAttr]?: string }
	Partial<
		GlobalAttrs & {
			role?: AriaRoles;
			aria?: AriaAttributes;
		} & ElementAttrs[E]
	>;
