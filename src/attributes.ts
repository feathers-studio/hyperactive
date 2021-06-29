import { Element } from "./elements.ts";
import { AriaRoles, AriaAttributes } from "./aria.ts";

type GlobalAttrs = {
	accesskey: string;
	autocapitalize: string;
	class: string;
	contenteditable: string;
	contextmenu: string;
	dir: string;
	draggable: string;
	hidden: string;
	id: string;
	itemprop: string;
	lang: string;
	slot: string;
	spellcheck: string;
	style: string;
	tabindex: string;
	title: string;
	translate: string;
};

type ElementAttrs = {
	a: {
		download: string;
		href: string;
		hreflang: string;
		media: string;
		ping: string;
		referrerpolicy: string;
		rel: string;
		shape: string;
		target: string;
	};
	applet: {
		align: string;
		alt: string;
		code: string;
		codebase: string;
	};
	area: {
		alt: string;
		coords: string;
		download: string;
		href: string;
		hreflang: string;
		media: string;
		ping: string;
		referrerpolicy: string;
		rel: string;
		shape: string;
		target: string;
	};
	audio: {
		autoplay: string;
		buffered: string;
		controls: string;
		crossorigin: string;
		loop: string;
		muted: string;
		preload: string;
		src: string;
	};
	base: {
		href: string;
		target: string;
	};
	basefont: {
		color: string;
	};
	bgsound: {
		loop: string;
	};
	blockquote: {
		cite: string;
	};
	body: {
		background: string;
		bgcolor: string;
	};
	button: {
		autofocus: string;
		disabled: string;
		form: string;
		formaction: string;
		formenctype: string;
		formmethod: string;
		formnovalidate: string;
		formtarget: string;
		name: string;
		type: string;
		value: string;
	};
	canvas: {
		height: string;
		width: string;
	};
	caption: {
		align: string;
	};
	col: {
		align: string;
		bgcolor: string;
		span: string;
	};
	colgroup: {
		align: string;
		bgcolor: string;
		span: string;
	};
	command: {
		checked: string;
		disabled: string;
		icon: string;
		radiogroup: string;
		type: string;
	};
	contenteditable: {
		enterkeyhint: string;
		inputmode: string;
	};
	data: {
		value: string;
	};
	del: {
		cite: string;
		datetime: string;
	};
	details: {
		open: string;
	};
	embed: {
		height: string;
		src: string;
		type: string;
		width: string;
	};
	fieldset: {
		disabled: string;
		form: string;
		name: string;
	};
	font: {
		color: string;
	};
	form: {
		accept: string;
		["accept-charset"]: string;
		action: string;
		autocomplete: string;
		enctype: string;
		method: string;
		name: string;
		novalidate: string;
		target: string;
	};
	hr: {
		align: string;
		color: string;
	};
	iframe: {
		align: string;
		allow: string;
		csp: string;
		height: string;
		importance: string;
		loading: string;
		name: string;
		referrerpolicy: string;
		sandbox: string;
		src: string;
		srcdoc: string;
		width: string;
	};
	img: {
		align: string;
		alt: string;
		border: string;
		crossorigin: string;
		decoding: string;
		height: string;
		importance: string;
		ismap: string;
		loading: string;
		referrerpolicy: string;
		sizes: string;
		src: string;
		srcset: string;
		usemap: string;
		width: string;
	};
	input: {
		accept: string;
		alt: string;
		autocomplete: string;
		autofocus: string;
		capture: string;
		checked: string;
		dirname: string;
		disabled: string;
		form: string;
		formaction: string;
		formenctype: string;
		formmethod: string;
		formnovalidate: string;
		formtarget: string;
		height: string;
		list: string;
		max: string;
		maxlength: string;
		min: string;
		minlength: string;
		multiple: string;
		name: string;
		pattern: string;
		placeholder: string;
		readonly: string;
		required: string;
		size: string;
		src: string;
		step: string;
		type: string;
		usemap: string;
		value: string;
		width: string;
	};
	ins: {
		cite: string;
		datetime: string;
	};
	keygen: {
		autofocus: string;
		challenge: string;
		disabled: string;
		form: string;
		keytype: string;
		name: string;
	};
	label: {
		for: string;
		form: string;
	};
	li: {
		value: string;
	};
	link: {
		crossorigin: string;
		href: string;
		hreflang: string;
		importance: string;
		integrity: string;
		media: string;
		referrerpolicy: string;
		rel: string;
		sizes: string;
	};
	map: {
		name: string;
	};
	marquee: {
		bgcolor: string;
		loop: string;
	};
	menu: {
		type: string;
	};
	meta: {
		charset: string;
		content: string;
		["http-equiv"]: string;
		name: string;
	};
	meter: {
		form: string;
		high: string;
		low: string;
		max: string;
		min: string;
		optimum: string;
		value: string;
	};
	object: {
		border: string;
		data: string;
		form: string;
		height: string;
		name: string;
		type: string;
		usemap: string;
		width: string;
	};
	ol: {
		reversed: string;
		start: string;
	};
	optgroup: {
		disabled: string;
		label: string;
	};
	option: {
		disabled: string;
		label: string;
		selected: string;
		value: string;
	};
	output: {
		for: string;
		form: string;
		name: string;
	};
	param: {
		name: string;
		value: string;
	};
	progress: {
		form: string;
		max: string;
		value: string;
	};
	q: {
		cite: string;
	};
	script: {
		async: string;
		charset: string;
		crossorigin: string;
		defer: string;
		importance: string;
		integrity: string;
		referrerpolicy: string;
		src: string;
		type: string;
	};
	select: {
		autocomplete: string;
		autofocus: string;
		disabled: string;
		form: string;
		multiple: string;
		name: string;
		required: string;
		size: string;
	};
	source: {
		media: string;
		sizes: string;
		src: string;
		srcset: string;
		type: string;
	};
	style: {
		media: string;
		type: string;
	};
	table: {
		align: string;
		background: string;
		bgcolor: string;
		border: string;
	};
	tbody: {
		align: string;
		bgcolor: string;
	};
	td: {
		align: string;
		background: string;
		bgcolor: string;
		colspan: string;
		headers: string;
		rowspan: string;
	};
	textarea: {
		autocomplete: string;
		autofocus: string;
		cols: string;
		dirname: string;
		disabled: string;
		enterkeyhint: string;
		form: string;
		inputmode: string;
		maxlength: string;
		minlength: string;
		name: string;
		placeholder: string;
		readonly: string;
		required: string;
		rows: string;
		wrap: string;
	};
	tfoot: {
		align: string;
		bgcolor: string;
	};
	th: {
		align: string;
		background: string;
		bgcolor: string;
		colspan: string;
		headers: string;
		rowspan: string;
		scope: string;
	};
	thead: {
		align: string;
	};
	time: {
		datetime: string;
	};
	tr: {
		align: string;
		bgcolor: string;
	};
	track: {
		default: string;
		kind: string;
		label: string;
		src: string;
		srclang: string;
	};
	video: {
		autoplay: string;
		buffered: string;
		controls: string;
		crossorigin: string;
		height: string;
		loop: string;
		muted: string;
		poster: string;
		preload: string;
		src: string;
		width: string;
	};
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
