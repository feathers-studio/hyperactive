import { Element } from "./elements.ts";
import { AriaRoles, AriaAttributes } from "./aria.ts";

type GlobalAttrs = {
	/**
	 * Keyboard shortcut to activate or add focus to the element.
	 */
	accesskey: string;
	/**
	 * Sets whether input is automatically capitalized when entered by user
	 */
	autocapitalize: "on" | "off" | "none" | "sentences" | "words" | "characters";
	/**
	 * Often used with CSS to style elements with common properties.
	 */
	class: string;
	/**
	 * Indicates whether the element's content is editable.
	 */
	contenteditable: "true" | "false";
	/**
	 * Defines the ID of a `<menu>` element which will serve as the element's context menu.
	 */
	contextmenu: string;
	/**
	 * Defines the text direction. Allowed values are ltr (Left-To-Right) or rtl (Right-To-Left)
	 */
	dir: "ltr" | "rtl" | "auto";
	/**
	 * Defines whether the element can be dragged.
	 */
	draggable: "true" | "false";
	/**
	 * Prevents rendering of given element, while keeping child elements, e.g. script elements, active.
	 */
	hidden: boolean;
	/**
	 * Often used with CSS to style a specific element. The value of this attribute must be unique.
	 */
	id: string;
	itemprop: string;
	/**
	 * Defines the language used in the element.
	 */
	lang: string;
	/**
	 * Assigns a slot in a shadow DOM shadow tree to an element.
	 */
	slot: string;
	/**
	 * Indicates whether spell checking is allowed for the element.
	 */
	spellcheck: "true" | "false";
	/**
	 * Defines CSS styles which will override styles previously set.
	 */
	style: string;
	/**
	 * Overrides the browser's default tab order and follows the one specified instead.
	 */
	tabindex: string;
	/**
	 * Text to be displayed in a tooltip when hovering over the element.
	 */
	title: string;
	/**
	 * Specify whether an element’s attribute values and the values of its Text node children are to be translated when the page is localized, or whether to leave them unchanged.
	 */
	translate: "yes" | "no";
};

type ElementAttrs = {
	a: {
		/**
		 * Indicates that the hyperlink is to be used for downloading a resource.
		 */
		download: string;
		/**
		 * The URL of a linked resource.
		 */
		href: string;
		/**
		 * Specifies the language of the linked resource.
		 */
		hreflang: string;
		/**
		 * Specifies a hint of the media for which the linked resource was designed.
		 */
		media: string;
		/**
		 * The ping attribute specifies a space-separated list of URLs to be notified if a user follows the hyperlink.
		 */
		ping: string;
		/**
		 * Specifies which referrer is sent when fetching the resource.
		 */
		referrerpolicy: string;
		/**
		 * Specifies the relationship of the target object to the link object.
		 */
		rel: string;
		shape: "circle" | "default" | "poly" | "rect";
		/**
		 * Specifies where to open the linked document (in the case of an `<a>` element) or where to display the response received (in the case of a `<form>` element)
		 */
		target: string;
	};
	applet: {
		/**
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Alternative text in case an image can't be displayed.
		 */
		alt: string;
		/**
		 * Specifies the URL of the applet's class file to be loaded and executed.
		 */
		code: string;
		/**
		 * This attribute gives the absolute or relative URL of the directory where applets' .class files referenced by the code attribute are stored.
		 */
		codebase: string;
	};
	area: {
		/**
		 * Alternative text in case an image can't be displayed.
		 */
		alt: string;
		/**
		 * A set of values specifying the coordinates of the hot-spot region.
		 */
		coords: string;
		/**
		 * Indicates that the hyperlink is to be used for downloading a resource.
		 */
		download: string;
		/**
		 * The URL of a linked resource.
		 */
		href: string;
		/**
		 * Specifies the language of the linked resource.
		 */
		hreflang: string;
		/**
		 * Specifies a hint of the media for which the linked resource was designed.
		 */
		media: string;
		/**
		 * The ping attribute specifies a space-separated list of URLs to be notified if a user follows the hyperlink.
		 */
		ping: string;
		/**
		 * Specifies which referrer is sent when fetching the resource.
		 */
		referrerpolicy: string;
		/**
		 * Specifies the relationship of the target object to the link object.
		 */
		rel: string;
		shape: "circle" | "default" | "poly" | "rect";
		/**
		 * Specifies where to open the linked document (in the case of an `<a>` element) or where to display the response received (in the case of a `<form>` element)
		 */
		target: string;
	};
	audio: {
		/**
		 * The audio or video should play as soon as possible.
		 */
		autoplay: boolean;
		/**
		 * Contains the time range of already buffered media.
		 */
		buffered: string;
		/**
		 * Indicates whether the browser should show playback controls to the user.
		 */
		controls: boolean;
		/**
		 * How the element handles cross-origin requests
		 */
		crossorigin: "anonymous" | "use-credentials";
		/**
		 * Indicates whether the media should start playing from the start when it's finished.
		 */
		loop: boolean;
		/**
		 * Indicates whether the audio will be initially silenced on page load.
		 */
		muted: boolean;
		/**
		 * Indicates whether the whole resource, parts of it or nothing should be preloaded.
		 */
		preload: "none" | "metadata" | "auto";
		/**
		 * The URL of the embeddable content.
		 */
		src: string;
	};
	base: {
		/**
		 * The URL of a linked resource.
		 */
		href: string;
		/**
		 * Specifies where to open the linked document (in the case of an `<a>` element) or where to display the response received (in the case of a `<form>` element)
		 */
		target: string;
	};
	basefont: {
		/**
		 * This attribute sets the text color using either a named color or a color specified in the hexadecimal #RRGGBB format.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS color property instead.
		 */
		color: string;
	};
	bgsound: {
		/**
		 * Indicates whether the media should start playing from the start when it's finished.
		 */
		loop: boolean;
	};
	blockquote: {
		/**
		 * Contains a URI which points to the source of the quote or change.
		 */
		cite: string;
	};
	body: {
		/**
		 * Specifies the URL of an image file.
		 *
		 * > Note: Although browsers and email clients may still support this attribute, it is obsolete. Use CSS background-image instead.
		 */
		background: string;
		/**
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
	};
	button: {
		/**
		 * The element should be automatically focused after the page loaded.
		 */
		autofocus: boolean;
		/**
		 * Indicates whether the user can interact with the element.
		 */
		disabled: boolean;
		/**
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Indicates the action of the element, overriding the action defined in the `<form>`.
		 */
		formaction: string;
		/**
		 * If the button/input is a submit button (type="submit"), this attribute sets the encoding type to use during form submission. If this attribute is specified, it overrides the enctype attribute of the button's form owner.
		 */
		formenctype: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
		/**
		 * If the button/input is a submit button (type="submit"), this attribute sets the submission method to use during form submission (GET, POST, etc.). If this attribute is specified, it overrides the method attribute of the button's form owner.
		 */
		formmethod: "GET" | "POST" | "dialog";
		/**
		 * If the button/input is a submit button (type="submit"), this boolean attribute specifies that the form is not to be validated when it is submitted. If this attribute is specified, it overrides the novalidate attribute of the button's form owner.
		 */
		formnovalidate: boolean;
		/**
		 * If the button/input is a submit button (type="submit"), this attribute specifies the browsing context (for example, tab, window, or inline frame) in which to display the response that is received after submitting the form. If this attribute is specified, it overrides the target attribute of the button's form owner.
		 */
		formtarget: string;
		/**
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
		/**
		 * Defines the type of the element.
		 */
		type: "submit" | "reset" | "button";
		/**
		 * Defines a default value which will be displayed in the element on page load.
		 */
		value: string;
	};
	canvas: {
		/**
		 * Specifies the height of the element.
		 */
		height: string;
		/**
		 * Specifies the width of the element.
		 */
		width: string;
	};
	caption: {
		/**
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
	};
	col: {
		/**
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
		span: string;
	};
	colgroup: {
		/**
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
		span: string;
	};
	command: {
		/**
		 * Indicates whether the element should be checked on page load.
		 */
		checked: boolean;
		/**
		 * Indicates whether the user can interact with the element.
		 */
		disabled: boolean;
		/**
		 * Specifies a picture which represents the command.
		 */
		icon: string;
		radiogroup: string;
		/**
		 * Defines the type of the element.
		 */
		type: string;
	};
	contenteditable: {
		/**
		 * The enterkeyhint specifies what action label (or icon) to present for the enter key on virtual keyboards. The attribute can be used with form controls (such as the value of textarea elements), or in elements in an editing host (e.g., using contenteditable attribute).
		 */
		enterkeyhint: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
		/**
		 * Provides a hint as to the type of data that might be entered by the user while editing the element or its contents. The attribute can be used with form controls (such as the value of textarea elements), or in elements in an editing host (e.g., using contenteditable attribute).
		 */
		inputmode: "none" | "text" | "tel" | "email" | "url" | "numeric" | "decimal" | "search";
	};
	data: {
		/**
		 * Defines a default value which will be displayed in the element on page load.
		 */
		value: string;
	};
	del: {
		/**
		 * Contains a URI which points to the source of the quote or change.
		 */
		cite: string;
		/**
		 * Indicates the date and time associated with the element.
		 */
		datetime: string;
	};
	details: {
		/**
		 * Indicates whether the details will be shown on page load.
		 */
		open: boolean;
	};
	embed: {
		/**
		 * Specifies the height of the element.
		 */
		height: string;
		/**
		 * The URL of the embeddable content.
		 */
		src: string;
		/**
		 * Defines the type of the element.
		 */
		type: `${string}/${string}`;
		/**
		 * Specifies the width of the element.
		 */
		width: string;
	};
	fieldset: {
		/**
		 * Indicates whether the user can interact with the element.
		 */
		disabled: boolean;
		/**
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
	};
	font: {
		/**
		 * This attribute sets the text color using either a named color or a color specified in the hexadecimal #RRGGBB format.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS color property instead.
		 */
		color: string;
	};
	form: {
		/**
		 * List of types the server accepts, typically a file type.
		 */
		accept: string;
		/**
		 * List of supported charsets.
		 */
		["accept-charset"]: "UTF-8";
		/**
		 * The URI of a program that processes the information submitted via the form.
		 */
		action: string;
		/**
		 * Indicates whether controls in this form can by default have their values automatically completed by the browser.
		 */
		autocomplete: "on" | "off";
		/**
		 * Defines the content type of the form data when the method is POST.
		 */
		enctype: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
		/**
		 * Defines which HTTP method to use when submitting the form. Can be GET (default) or POST.
		 */
		method: "GET" | "POST" | "dialog";
		/**
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
		/**
		 * This attribute indicates that the form shouldn't be validated when submitted.
		 */
		novalidate: boolean;
		/**
		 * Specifies where to open the linked document (in the case of an `<a>` element) or where to display the response received (in the case of a `<form>` element)
		 */
		target: string;
	};
	hr: {
		/**
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * This attribute sets the text color using either a named color or a color specified in the hexadecimal #RRGGBB format.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS color property instead.
		 */
		color: string;
	};
	iframe: {
		/**
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Specifies a feature-policy for the iframe.
		 */
		allow: string;
		/**
		 * Specifies the Content Security Policy that an embedded document must agree to enforce upon itself.
		 */
		csp: string;
		/**
		 * Specifies the height of the element.
		 */
		height: string;
		/**
		 * Indicates the relative fetch priority for the resource.
		 */
		importance: string;
		/**
		 * Indicates if the element should be loaded lazily (loading="lazy") or loaded immediately (loading="eager").
		 *
		 * WIP: WHATWG PR #3752
		 */
		loading: "lazy" | "eager";
		/**
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
		/**
		 * Specifies which referrer is sent when fetching the resource.
		 */
		referrerpolicy: string;
		/**
		 * Stops a document loaded in an iframe from using certain features (such as submitting forms or opening new windows).
		 */
		sandbox: "allow-forms" | "allow-modals" | "allow-orientation-lock" | "allow-pointer-lock" | "allow-popups" | "allow-popups-to-escape-sandbox" | "allow-presentation" | "allow-same-origin" | "allow-scripts" | "allow-top-navigation";
		/**
		 * The URL of the embeddable content.
		 */
		src: string;
		srcdoc: string;
		/**
		 * Specifies the width of the element.
		 */
		width: string;
	};
	img: {
		/**
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Alternative text in case an image can't be displayed.
		 */
		alt: string;
		/**
		 * The border width.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS border property instead.
		 */
		border: string;
		/**
		 * How the element handles cross-origin requests
		 */
		crossorigin: "anonymous" | "use-credentials";
		/**
		 * Indicates the preferred method to decode the image.
		 */
		decoding: "sync" | "async" | "auto";
		/**
		 * Specifies the height of the element.
		 */
		height: string;
		/**
		 * Indicates the relative fetch priority for the resource.
		 */
		importance: string;
		/**
		 * Indicates that the image is part of a server-side image map.
		 */
		ismap: boolean;
		/**
		 * Indicates if the element should be loaded lazily (loading="lazy") or loaded immediately (loading="eager").
		 *
		 * WIP: WHATWG PR #3752
		 */
		loading: "lazy" | "eager";
		/**
		 * Specifies which referrer is sent when fetching the resource.
		 */
		referrerpolicy: string;
		sizes: string;
		/**
		 * The URL of the embeddable content.
		 */
		src: string;
		/**
		 * One or more responsive image candidates.
		 */
		srcset: string;
		usemap: string;
		/**
		 * Specifies the width of the element.
		 */
		width: string;
	};
	input: {
		/**
		 * List of types the server accepts, typically a file type.
		 */
		accept: string;
		/**
		 * Alternative text in case an image can't be displayed.
		 */
		alt: string;
		/**
		 * Indicates whether controls in this form can by default have their values automatically completed by the browser.
		 */
		autocomplete: "on" | "off";
		/**
		 * The element should be automatically focused after the page loaded.
		 */
		autofocus: boolean;
		/**
		 * From the HTML Media CaptureThe definition of 'media capture' in that specification.spec, specifies a new file can be captured.
		 */
		capture: string;
		/**
		 * Indicates whether the element should be checked on page load.
		 */
		checked: boolean;
		dirname: string;
		/**
		 * Indicates whether the user can interact with the element.
		 */
		disabled: boolean;
		/**
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Indicates the action of the element, overriding the action defined in the `<form>`.
		 */
		formaction: string;
		/**
		 * If the button/input is a submit button (type="submit"), this attribute sets the encoding type to use during form submission. If this attribute is specified, it overrides the enctype attribute of the button's form owner.
		 */
		formenctype: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
		/**
		 * If the button/input is a submit button (type="submit"), this attribute sets the submission method to use during form submission (GET, POST, etc.). If this attribute is specified, it overrides the method attribute of the button's form owner.
		 */
		formmethod: "GET" | "POST" | "dialog";
		/**
		 * If the button/input is a submit button (type="submit"), this boolean attribute specifies that the form is not to be validated when it is submitted. If this attribute is specified, it overrides the novalidate attribute of the button's form owner.
		 */
		formnovalidate: boolean;
		/**
		 * If the button/input is a submit button (type="submit"), this attribute specifies the browsing context (for example, tab, window, or inline frame) in which to display the response that is received after submitting the form. If this attribute is specified, it overrides the target attribute of the button's form owner.
		 */
		formtarget: string;
		/**
		 * Specifies the height of the element.
		 */
		height: string;
		/**
		 * Identifies a list of pre-defined options to suggest to the user.
		 */
		list: string;
		/**
		 * Indicates the maximum value allowed.
		 */
		max: string;
		/**
		 * Defines the maximum number of characters allowed in the element.
		 */
		maxlength: string;
		/**
		 * Indicates the minimum value allowed.
		 */
		min: string;
		/**
		 * Defines the minimum number of characters allowed in the element.
		 */
		minlength: string;
		/**
		 * Indicates whether multiple values can be entered in an input of the type email or file.
		 */
		multiple: boolean;
		/**
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
		/**
		 * Defines a regular expression which the element's value will be validated against.
		 */
		pattern: string;
		/**
		 * Provides a hint to the user of what can be entered in the field.
		 */
		placeholder: string;
		/**
		 * Indicates whether the element can be edited.
		 */
		readonly: boolean;
		/**
		 * Indicates whether this element is required to fill out or not.
		 */
		required: boolean;
		/**
		 * Defines the width of the element (in pixels). If the element's type attribute is text or password then it's the number of characters.
		 */
		size: string;
		/**
		 * The URL of the embeddable content.
		 */
		src: string;
		step: number | "any";
		/**
		 * Defines the type of the element.
		 */
		type: "hidden" | "text" | "search" | "tel" | "url" | "email" | "password" | "date" | "month" | "week" | "time" | "datetime" | "number" | "range" | "color" | "checkbox" | "radio" | "file" | "submit" | "image" | "reset" | "button";
		usemap: string;
		/**
		 * Defines a default value which will be displayed in the element on page load.
		 */
		value: string;
		/**
		 * Specifies the width of the element.
		 */
		width: string;
	};
	ins: {
		/**
		 * Contains a URI which points to the source of the quote or change.
		 */
		cite: string;
		/**
		 * Indicates the date and time associated with the element.
		 */
		datetime: string;
	};
	keygen: {
		/**
		 * The element should be automatically focused after the page loaded.
		 */
		autofocus: boolean;
		/**
		 * A challenge string that is submitted along with the public key.
		 */
		challenge: string;
		/**
		 * Indicates whether the user can interact with the element.
		 */
		disabled: boolean;
		/**
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Specifies the type of key generated.
		 */
		keytype: string;
		/**
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
	};
	label: {
		/**
		 * Describes elements which belongs to this one.
		 */
		for: string;
		/**
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
	};
	li: {
		/**
		 * Defines a default value which will be displayed in the element on page load.
		 */
		value: string;
	};
	link: {
		/**
		 * How the element handles cross-origin requests
		 */
		crossorigin: "anonymous" | "use-credentials";
		/**
		 * The URL of a linked resource.
		 */
		href: string;
		/**
		 * Specifies the language of the linked resource.
		 */
		hreflang: string;
		/**
		 * Indicates the relative fetch priority for the resource.
		 */
		importance: string;
		/**
		 * Specifies a Subresource Integrity value that allows browsers to verify what they fetch.
		 */
		integrity: string;
		/**
		 * Specifies a hint of the media for which the linked resource was designed.
		 */
		media: string;
		/**
		 * Specifies which referrer is sent when fetching the resource.
		 */
		referrerpolicy: string;
		/**
		 * Specifies the relationship of the target object to the link object.
		 */
		rel: string;
		sizes: string;
	};
	map: {
		/**
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
	};
	marquee: {
		/**
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
		/**
		 * Indicates whether the media should start playing from the start when it's finished.
		 */
		loop: boolean;
	};
	menu: {
		/**
		 * Defines the type of the element.
		 */
		type: string;
	};
	meta: {
		/**
		 * Declares the character encoding of the page or script.
		 */
		charset: "utf-8";
		/**
		 * A value associated with http-equiv or name depending on the context.
		 */
		content: string;
		/**
		 * Defines a pragma directive.
		 */
		["http-equiv"]: "content-type" | "default-style" | "refresh" | "x-ua-compatible" | "content-security-policy";
		/**
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
	};
	meter: {
		/**
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Indicates the lower bound of the upper range.
		 */
		high: string;
		/**
		 * Indicates the upper bound of the lower range.
		 */
		low: string;
		/**
		 * Indicates the maximum value allowed.
		 */
		max: string;
		/**
		 * Indicates the minimum value allowed.
		 */
		min: string;
		/**
		 * Indicates the optimal numeric value.
		 */
		optimum: string;
		/**
		 * Defines a default value which will be displayed in the element on page load.
		 */
		value: string;
	};
	object: {
		/**
		 * The border width.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS border property instead.
		 */
		border: string;
		/**
		 * Specifies the URL of the resource.
		 */
		data: string;
		/**
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Specifies the height of the element.
		 */
		height: string;
		/**
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
		/**
		 * Defines the type of the element.
		 */
		type: `${string}/${string}`;
		usemap: string;
		/**
		 * Specifies the width of the element.
		 */
		width: string;
	};
	ol: {
		/**
		 * Indicates whether the list should be displayed in a descending order instead of a ascending.
		 */
		reversed: boolean;
		/**
		 * Defines the first number if other than 1.
		 */
		start: string;
	};
	optgroup: {
		/**
		 * Indicates whether the user can interact with the element.
		 */
		disabled: boolean;
		/**
		 * Specifies a user-readable title of the element.
		 */
		label: string;
	};
	option: {
		/**
		 * Indicates whether the user can interact with the element.
		 */
		disabled: boolean;
		/**
		 * Specifies a user-readable title of the element.
		 */
		label: string;
		/**
		 * Defines a value which will be selected on page load.
		 */
		selected: boolean;
		/**
		 * Defines a default value which will be displayed in the element on page load.
		 */
		value: string;
	};
	output: {
		/**
		 * Describes elements which belongs to this one.
		 */
		for: string;
		/**
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
	};
	param: {
		/**
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
		/**
		 * Defines a default value which will be displayed in the element on page load.
		 */
		value: string;
	};
	progress: {
		/**
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Indicates the maximum value allowed.
		 */
		max: string;
		/**
		 * Defines a default value which will be displayed in the element on page load.
		 */
		value: string;
	};
	q: {
		/**
		 * Contains a URI which points to the source of the quote or change.
		 */
		cite: string;
	};
	script: {
		/**
		 * Executes the script asynchronously.
		 */
		async: boolean;
		/**
		 * Declares the character encoding of the page or script.
		 */
		charset: "utf-8";
		/**
		 * How the element handles cross-origin requests
		 */
		crossorigin: "anonymous" | "use-credentials";
		/**
		 * Indicates that the script should be executed after the page has been parsed.
		 */
		defer: boolean;
		/**
		 * Indicates the relative fetch priority for the resource.
		 */
		importance: string;
		/**
		 * Specifies a Subresource Integrity value that allows browsers to verify what they fetch.
		 */
		integrity: string;
		/**
		 * Specifies which referrer is sent when fetching the resource.
		 */
		referrerpolicy: string;
		/**
		 * The URL of the embeddable content.
		 */
		src: string;
		/**
		 * Defines the type of the element.
		 */
		type: "module" | `${string}/${string}`;
	};
	select: {
		/**
		 * Indicates whether controls in this form can by default have their values automatically completed by the browser.
		 */
		autocomplete: "on" | "off";
		/**
		 * The element should be automatically focused after the page loaded.
		 */
		autofocus: boolean;
		/**
		 * Indicates whether the user can interact with the element.
		 */
		disabled: boolean;
		/**
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Indicates whether multiple values can be entered in an input of the type email or file.
		 */
		multiple: boolean;
		/**
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
		/**
		 * Indicates whether this element is required to fill out or not.
		 */
		required: boolean;
		/**
		 * Defines the width of the element (in pixels). If the element's type attribute is text or password then it's the number of characters.
		 */
		size: string;
	};
	source: {
		/**
		 * Specifies a hint of the media for which the linked resource was designed.
		 */
		media: string;
		sizes: string;
		/**
		 * The URL of the embeddable content.
		 */
		src: string;
		/**
		 * One or more responsive image candidates.
		 */
		srcset: string;
		/**
		 * Defines the type of the element.
		 */
		type: `${string}/${string}`;
	};
	style: {
		/**
		 * Specifies a hint of the media for which the linked resource was designed.
		 */
		media: string;
		/**
		 * Defines the type of the element.
		 */
		type: string;
	};
	table: {
		/**
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Specifies the URL of an image file.
		 *
		 * > Note: Although browsers and email clients may still support this attribute, it is obsolete. Use CSS background-image instead.
		 */
		background: string;
		/**
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
		/**
		 * The border width.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS border property instead.
		 */
		border: string;
	};
	tbody: {
		/**
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
	};
	td: {
		/**
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Specifies the URL of an image file.
		 *
		 * > Note: Although browsers and email clients may still support this attribute, it is obsolete. Use CSS background-image instead.
		 */
		background: string;
		/**
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
		/**
		 * The colspan attribute defines the number of columns a cell should span.
		 */
		colspan: string;
		/**
		 * IDs of the `<th>` elements which applies to this element.
		 */
		headers: string;
		/**
		 * Defines the number of rows a table cell should span over.
		 */
		rowspan: string;
	};
	textarea: {
		/**
		 * Indicates whether controls in this form can by default have their values automatically completed by the browser.
		 */
		autocomplete: "on" | "off";
		/**
		 * The element should be automatically focused after the page loaded.
		 */
		autofocus: boolean;
		/**
		 * Defines the number of columns in a textarea.
		 */
		cols: string;
		dirname: string;
		/**
		 * Indicates whether the user can interact with the element.
		 */
		disabled: boolean;
		/**
		 * The enterkeyhint specifies what action label (or icon) to present for the enter key on virtual keyboards. The attribute can be used with form controls (such as the value of textarea elements), or in elements in an editing host (e.g., using contenteditable attribute).
		 */
		enterkeyhint: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
		/**
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Provides a hint as to the type of data that might be entered by the user while editing the element or its contents. The attribute can be used with form controls (such as the value of textarea elements), or in elements in an editing host (e.g., using contenteditable attribute).
		 */
		inputmode: "none" | "text" | "tel" | "email" | "url" | "numeric" | "decimal" | "search";
		/**
		 * Defines the maximum number of characters allowed in the element.
		 */
		maxlength: string;
		/**
		 * Defines the minimum number of characters allowed in the element.
		 */
		minlength: string;
		/**
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
		/**
		 * Provides a hint to the user of what can be entered in the field.
		 */
		placeholder: string;
		/**
		 * Indicates whether the element can be edited.
		 */
		readonly: boolean;
		/**
		 * Indicates whether this element is required to fill out or not.
		 */
		required: boolean;
		/**
		 * Defines the number of rows in a text area.
		 */
		rows: string;
		/**
		 * Indicates whether the text should be wrapped.
		 */
		wrap: "soft" | "hard";
	};
	tfoot: {
		/**
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
	};
	th: {
		/**
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Specifies the URL of an image file.
		 *
		 * > Note: Although browsers and email clients may still support this attribute, it is obsolete. Use CSS background-image instead.
		 */
		background: string;
		/**
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
		/**
		 * The colspan attribute defines the number of columns a cell should span.
		 */
		colspan: string;
		/**
		 * IDs of the `<th>` elements which applies to this element.
		 */
		headers: string;
		/**
		 * Defines the number of rows a table cell should span over.
		 */
		rowspan: string;
		/**
		 * Defines the cells that the header test (defined in the th element) relates to.
		 */
		scope: "row" | "col" | "rowgroup" | "colgroup";
	};
	thead: {
		/**
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
	};
	time: {
		/**
		 * Indicates the date and time associated with the element.
		 */
		datetime: string;
	};
	tr: {
		/**
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
	};
	track: {
		/**
		 * Indicates that the track should be enabled unless the user's preferences indicate something different.
		 */
		default: boolean;
		/**
		 * Specifies the kind of text track.
		 */
		kind: "subtitles" | "captions" | "descriptions" | "chapters" | "metadata";
		/**
		 * Specifies a user-readable title of the element.
		 */
		label: string;
		/**
		 * The URL of the embeddable content.
		 */
		src: string;
		srclang: string;
	};
	video: {
		/**
		 * The audio or video should play as soon as possible.
		 */
		autoplay: boolean;
		/**
		 * Contains the time range of already buffered media.
		 */
		buffered: string;
		/**
		 * Indicates whether the browser should show playback controls to the user.
		 */
		controls: boolean;
		/**
		 * How the element handles cross-origin requests
		 */
		crossorigin: "anonymous" | "use-credentials";
		/**
		 * Specifies the height of the element.
		 */
		height: string;
		/**
		 * Indicates whether the media should start playing from the start when it's finished.
		 */
		loop: boolean;
		/**
		 * Indicates whether the audio will be initially silenced on page load.
		 */
		muted: boolean;
		/**
		 * A URL indicating a poster frame to show until the user plays or seeks.
		 */
		poster: string;
		/**
		 * Indicates whether the whole resource, parts of it or nothing should be preloaded.
		 */
		preload: "none" | "metadata" | "auto";
		/**
		 * The URL of the embeddable content.
		 */
		src: string;
		/**
		 * Specifies the width of the element.
		 */
		width: string;
	};
};

type PropOr<T, P extends string | symbol | number, D> =
	T extends Record<P, infer V> ? V : D;

type Deunionize<T> =
	| ([undefined] extends [T] ? undefined : never)
	| { [K in T extends unknown ? keyof T : never]: PropOr<NonNullable<T>, K, undefined>; };

export type AllAttrs = Partial<Deunionize<ElementAttrs[keyof ElementAttrs]>>;

export type DataAttr = `data-${string}`;

export type Attr<E extends Element = Element> =
	// TODO(mkr): will work in TS 4.4
	// { [data in DataAttr]?: string }
	Partial<
		GlobalAttrs & {
			/**
			 * When the element lacks suitable ARIA-semantics, authors must
			 * assign an ARIA-role. Addition of ARIA semantics only exposes
			 * extra information to a browser's accessibility API, and does
			 * not affect a page's DOM.
			 * 
			 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques
			 */
			role: AriaRoles;
			/**
			 * ARIA is a set of attributes that define ways to make web content
			 * and web applications (especially those developed with JavaScript)
			 * more accessible to people with disabilities.
			 * 
			 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA
			 */
			aria: AriaAttributes;
		} & (ElementAttrs & { [k: string]: unknown })[E]
	>;
