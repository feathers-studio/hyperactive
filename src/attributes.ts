import { Element } from "./elements.ts";
import { AriaRoles, AriaAttributes } from "./aria.ts";

type GlobalAttrs = {
	/**
	 * Global attribute
	 *
	 * Keyboard shortcut to activate or add focus to the element.
	 */
	accesskey: string;
	/**
	 * Global attribute
	 *
	 * Sets whether input is automatically capitalized when entered by user
	 */
	autocapitalize: string;
	/**
	 * Global attribute
	 *
	 * Often used with CSS to style elements with common properties.
	 */
	class: string;
	/**
	 * Global attribute
	 *
	 * Indicates whether the element's content is editable.
	 */
	contenteditable: string;
	/**
	 * Global attribute
	 *
	 * Defines the ID of a `<menu>` element which will serve as the element's context menu.
	 */
	contextmenu: string;
	/**
	 * Global attribute
	 *
	 * Defines the text direction. Allowed values are ltr (Left-To-Right) or rtl (Right-To-Left)
	 */
	dir: string;
	/**
	 * Global attribute
	 *
	 * Defines whether the element can be dragged.
	 */
	draggable: string;
	/**
	 * Global attribute
	 *
	 * Prevents rendering of given element, while keeping child elements, e.g. script elements, active.
	 */
	hidden: string;
	/**
	 * Global attribute
	 *
	 * Often used with CSS to style a specific element. The value of this attribute must be unique.
	 */
	id: string;
	/**
	 * Global attribute
	 */
	itemprop: string;
	/**
	 * Global attribute
	 *
	 * Defines the language used in the element.
	 */
	lang: string;
	/**
	 * Global attribute
	 *
	 * Assigns a slot in a shadow DOM shadow tree to an element.
	 */
	slot: string;
	/**
	 * Global attribute
	 *
	 * Indicates whether spell checking is allowed for the element.
	 */
	spellcheck: string;
	/**
	 * Global attribute
	 *
	 * Defines CSS styles which will override styles previously set.
	 */
	style: string;
	/**
	 * Global attribute
	 *
	 * Overrides the browser's default tab order and follows the one specified instead.
	 */
	tabindex: string;
	/**
	 * Global attribute
	 *
	 * Text to be displayed in a tooltip when hovering over the element.
	 */
	title: string;
	/**
	 * Global attribute
	 *
	 * Specify whether an element’s attribute values and the values of its Text node children are to be translated when the page is localized, or whether to leave them unchanged.
	 */
	translate: string;
};

type ElementAttrs = {
	a: {
		/**
		 * Applies to `a`, `area`
		 *
		 * Indicates that the hyperlink is to be used for downloading a resource.
		 */
		download: string;
		/**
		 * Applies to `a`, `area`, `base`, `link`
		 *
		 * The URL of a linked resource.
		 */
		href: string;
		/**
		 * Applies to `a`, `area`, `link`
		 *
		 * Specifies the language of the linked resource.
		 */
		hreflang: string;
		/**
		 * Applies to `a`, `area`, `link`, `source`, `style`
		 *
		 * Specifies a hint of the media for which the linked resource was designed.
		 */
		media: string;
		/**
		 * Applies to `a`, `area`
		 *
		 * The ping attribute specifies a space-separated list of URLs to be notified if a user follows the hyperlink.
		 */
		ping: string;
		/**
		 * Applies to `a`, `area`, `iframe`, `img`, `link`, `script`
		 *
		 * Specifies which referrer is sent when fetching the resource.
		 */
		referrerpolicy: string;
		/**
		 * Applies to `a`, `area`, `link`
		 *
		 * Specifies the relationship of the target object to the link object.
		 */
		rel: string;
		/**
		 * Applies to `a`, `area`
		 */
		shape: string;
		/**
		 * Applies to `a`, `area`, `base`, `form`
		 *
		 * Specifies where to open the linked document (in the case of an `<a>` element) or where to display the response received (in the case of a `<form>` element)
		 */
		target: string;
	};
	applet: {
		/**
		 * Applies to `applet`, `caption`, `col`, `colgroup`, `hr`, `iframe`, `img`, `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `tr`
		 *
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Applies to `applet`, `area`, `img`, `input`
		 *
		 * Alternative text in case an image can't be displayed.
		 */
		alt: string;
		/**
		 * Applies to `applet`
		 *
		 * Specifies the URL of the applet's class file to be loaded and executed.
		 */
		code: string;
		/**
		 * Applies to `applet`
		 *
		 * This attribute gives the absolute or relative URL of the directory where applets' .class files referenced by the code attribute are stored.
		 */
		codebase: string;
	};
	area: {
		/**
		 * Applies to `applet`, `area`, `img`, `input`
		 *
		 * Alternative text in case an image can't be displayed.
		 */
		alt: string;
		/**
		 * Applies to `area`
		 *
		 * A set of values specifying the coordinates of the hot-spot region.
		 */
		coords: string;
		/**
		 * Applies to `a`, `area`
		 *
		 * Indicates that the hyperlink is to be used for downloading a resource.
		 */
		download: string;
		/**
		 * Applies to `a`, `area`, `base`, `link`
		 *
		 * The URL of a linked resource.
		 */
		href: string;
		/**
		 * Applies to `a`, `area`, `link`
		 *
		 * Specifies the language of the linked resource.
		 */
		hreflang: string;
		/**
		 * Applies to `a`, `area`, `link`, `source`, `style`
		 *
		 * Specifies a hint of the media for which the linked resource was designed.
		 */
		media: string;
		/**
		 * Applies to `a`, `area`
		 *
		 * The ping attribute specifies a space-separated list of URLs to be notified if a user follows the hyperlink.
		 */
		ping: string;
		/**
		 * Applies to `a`, `area`, `iframe`, `img`, `link`, `script`
		 *
		 * Specifies which referrer is sent when fetching the resource.
		 */
		referrerpolicy: string;
		/**
		 * Applies to `a`, `area`, `link`
		 *
		 * Specifies the relationship of the target object to the link object.
		 */
		rel: string;
		/**
		 * Applies to `a`, `area`
		 */
		shape: string;
		/**
		 * Applies to `a`, `area`, `base`, `form`
		 *
		 * Specifies where to open the linked document (in the case of an `<a>` element) or where to display the response received (in the case of a `<form>` element)
		 */
		target: string;
	};
	audio: {
		/**
		 * Applies to `audio`, `video`
		 *
		 * The audio or video should play as soon as possible.
		 */
		autoplay: string;
		/**
		 * Applies to `audio`, `video`
		 *
		 * Contains the time range of already buffered media.
		 */
		buffered: string;
		/**
		 * Applies to `audio`, `video`
		 *
		 * Indicates whether the browser should show playback controls to the user.
		 */
		controls: string;
		/**
		 * Applies to `audio`, `img`, `link`, `script`, `video`
		 *
		 * How the element handles cross-origin requests
		 */
		crossorigin: string;
		/**
		 * Applies to `audio`, `bgsound`, `marquee`, `video`
		 *
		 * Indicates whether the media should start playing from the start when it's finished.
		 */
		loop: string;
		/**
		 * Applies to `audio`, `video`
		 *
		 * Indicates whether the audio will be initially silenced on page load.
		 */
		muted: string;
		/**
		 * Applies to `audio`, `video`
		 *
		 * Indicates whether the whole resource, parts of it or nothing should be preloaded.
		 */
		preload: string;
		/**
		 * Applies to `audio`, `embed`, `iframe`, `img`, `input`, `script`, `source`, `track`, `video`
		 *
		 * The URL of the embeddable content.
		 */
		src: string;
	};
	base: {
		/**
		 * Applies to `a`, `area`, `base`, `link`
		 *
		 * The URL of a linked resource.
		 */
		href: string;
		/**
		 * Applies to `a`, `area`, `base`, `form`
		 *
		 * Specifies where to open the linked document (in the case of an `<a>` element) or where to display the response received (in the case of a `<form>` element)
		 */
		target: string;
	};
	basefont: {
		/**
		 * Applies to `basefont`, `font`, `hr`
		 *
		 * This attribute sets the text color using either a named color or a color specified in the hexadecimal #RRGGBB format.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS color property instead.
		 */
		color: string;
	};
	bgsound: {
		/**
		 * Applies to `audio`, `bgsound`, `marquee`, `video`
		 *
		 * Indicates whether the media should start playing from the start when it's finished.
		 */
		loop: string;
	};
	blockquote: {
		/**
		 * Applies to `blockquote`, `del`, `ins`, `q`
		 *
		 * Contains a URI which points to the source of the quote or change.
		 */
		cite: string;
	};
	body: {
		/**
		 * Applies to `body`, `table`, `td`, `th`
		 *
		 * Specifies the URL of an image file.
		 *
		 * > Note: Although browsers and email clients may still support this attribute, it is obsolete. Use CSS background-image instead.
		 */
		background: string;
		/**
		 * Applies to `body`, `col`, `colgroup`, `marquee`, `table`, `tbody`, `tfoot`, `td`, `th`, `tr`
		 *
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
	};
	button: {
		/**
		 * Applies to `button`, `input`, `keygen`, `select`, `textarea`
		 *
		 * The element should be automatically focused after the page loaded.
		 */
		autofocus: string;
		/**
		 * Applies to `button`, `command`, `fieldset`, `input`, `keygen`, `optgroup`, `option`, `select`, `textarea`
		 *
		 * Indicates whether the user can interact with the element.
		 */
		disabled: string;
		/**
		 * Applies to `button`, `fieldset`, `input`, `keygen`, `label`, `meter`, `object`, `output`, `progress`, `select`, `textarea`
		 *
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Applies to `input`, `button`
		 *
		 * Indicates the action of the element, overriding the action defined in the `<form>`.
		 */
		formaction: string;
		/**
		 * Applies to `button`, `input`
		 *
		 * If the button/input is a submit button (type="submit"), this attribute sets the encoding type to use during form submission. If this attribute is specified, it overrides the enctype attribute of the button's form owner.
		 */
		formenctype: string;
		/**
		 * Applies to `button`, `input`
		 *
		 * If the button/input is a submit button (type="submit"), this attribute sets the submission method to use during form submission (GET, POST, etc.). If this attribute is specified, it overrides the method attribute of the button's form owner.
		 */
		formmethod: string;
		/**
		 * Applies to `button`, `input`
		 *
		 * If the button/input is a submit button (type="submit"), this boolean attribute specifies that the form is not to be validated when it is submitted. If this attribute is specified, it overrides the novalidate attribute of the button's form owner.
		 */
		formnovalidate: string;
		/**
		 * Applies to `button`, `input`
		 *
		 * If the button/input is a submit button (type="submit"), this attribute specifies the browsing context (for example, tab, window, or inline frame) in which to display the response that is received after submitting the form. If this attribute is specified, it overrides the target attribute of the button's form owner.
		 */
		formtarget: string;
		/**
		 * Applies to `button`, `form`, `fieldset`, `iframe`, `input`, `keygen`, `object`, `output`, `select`, `textarea`, `map`, `meta`, `param`
		 *
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
		/**
		 * Applies to `button`, `input`, `command`, `embed`, `object`, `script`, `source`, `style`, `menu`
		 *
		 * Defines the type of the element.
		 */
		type: string;
		/**
		 * Applies to `button`, `data`, `input`, `li`, `meter`, `option`, `progress`, `param`
		 *
		 * Defines a default value which will be displayed in the element on page load.
		 */
		value: string;
	};
	canvas: {
		/**
		 * Applies to `canvas`, `embed`, `iframe`, `img`, `input`, `object`, `video`
		 *
		 * Specifies the height of elements listed here. For all other elements, use the CSS height property.
		 *
		 * > Note: In some instances, such as `<div>`, this is a legacy attribute, in which case the CSS height property should be used instead.
		 */
		height: string;
		/**
		 * Applies to `canvas`, `embed`, `iframe`, `img`, `input`, `object`, `video`
		 *
		 * For the elements listed here, this establishes the element's width.
		 *
		 * > Note: For all other instances, such as `<div>`, this is a legacy attribute, in which case the CSS width property should be used instead.
		 */
		width: string;
	};
	caption: {
		/**
		 * Applies to `applet`, `caption`, `col`, `colgroup`, `hr`, `iframe`, `img`, `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `tr`
		 *
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
	};
	col: {
		/**
		 * Applies to `applet`, `caption`, `col`, `colgroup`, `hr`, `iframe`, `img`, `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `tr`
		 *
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Applies to `body`, `col`, `colgroup`, `marquee`, `table`, `tbody`, `tfoot`, `td`, `th`, `tr`
		 *
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
		/**
		 * Applies to `col`, `colgroup`
		 */
		span: string;
	};
	colgroup: {
		/**
		 * Applies to `applet`, `caption`, `col`, `colgroup`, `hr`, `iframe`, `img`, `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `tr`
		 *
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Applies to `body`, `col`, `colgroup`, `marquee`, `table`, `tbody`, `tfoot`, `td`, `th`, `tr`
		 *
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
		/**
		 * Applies to `col`, `colgroup`
		 */
		span: string;
	};
	command: {
		/**
		 * Applies to `command`, `input`
		 *
		 * Indicates whether the element should be checked on page load.
		 */
		checked: string;
		/**
		 * Applies to `button`, `command`, `fieldset`, `input`, `keygen`, `optgroup`, `option`, `select`, `textarea`
		 *
		 * Indicates whether the user can interact with the element.
		 */
		disabled: string;
		/**
		 * Applies to `command`
		 *
		 * Specifies a picture which represents the command.
		 */
		icon: string;
		/**
		 * Applies to `command`
		 */
		radiogroup: string;
		/**
		 * Applies to `button`, `input`, `command`, `embed`, `object`, `script`, `source`, `style`, `menu`
		 *
		 * Defines the type of the element.
		 */
		type: string;
	};
	contenteditable: {
		/**
		 * Applies to `textarea`, `contenteditable`
		 *
		 * The enterkeyhint specifies what action label (or icon) to present for the enter key on virtual keyboards. The attribute can be used with form controls (such as the value of textarea elements), or in elements in an editing host (e.g., using contenteditable attribute).
		 */
		enterkeyhint: string;
		/**
		 * Applies to `textarea`, `contenteditable`
		 *
		 * Provides a hint as to the type of data that might be entered by the user while editing the element or its contents. The attribute can be used with form controls (such as the value of textarea elements), or in elements in an editing host (e.g., using contenteditable attribute).
		 */
		inputmode: string;
	};
	data: {
		/**
		 * Applies to `button`, `data`, `input`, `li`, `meter`, `option`, `progress`, `param`
		 *
		 * Defines a default value which will be displayed in the element on page load.
		 */
		value: string;
	};
	del: {
		/**
		 * Applies to `blockquote`, `del`, `ins`, `q`
		 *
		 * Contains a URI which points to the source of the quote or change.
		 */
		cite: string;
		/**
		 * Applies to `del`, `ins`, `time`
		 *
		 * Indicates the date and time associated with the element.
		 */
		datetime: string;
	};
	details: {
		/**
		 * Applies to `details`
		 *
		 * Indicates whether the details will be shown on page load.
		 */
		open: string;
	};
	embed: {
		/**
		 * Applies to `canvas`, `embed`, `iframe`, `img`, `input`, `object`, `video`
		 *
		 * Specifies the height of elements listed here. For all other elements, use the CSS height property.
		 *
		 * > Note: In some instances, such as `<div>`, this is a legacy attribute, in which case the CSS height property should be used instead.
		 */
		height: string;
		/**
		 * Applies to `audio`, `embed`, `iframe`, `img`, `input`, `script`, `source`, `track`, `video`
		 *
		 * The URL of the embeddable content.
		 */
		src: string;
		/**
		 * Applies to `button`, `input`, `command`, `embed`, `object`, `script`, `source`, `style`, `menu`
		 *
		 * Defines the type of the element.
		 */
		type: string;
		/**
		 * Applies to `canvas`, `embed`, `iframe`, `img`, `input`, `object`, `video`
		 *
		 * For the elements listed here, this establishes the element's width.
		 *
		 * > Note: For all other instances, such as `<div>`, this is a legacy attribute, in which case the CSS width property should be used instead.
		 */
		width: string;
	};
	fieldset: {
		/**
		 * Applies to `button`, `command`, `fieldset`, `input`, `keygen`, `optgroup`, `option`, `select`, `textarea`
		 *
		 * Indicates whether the user can interact with the element.
		 */
		disabled: string;
		/**
		 * Applies to `button`, `fieldset`, `input`, `keygen`, `label`, `meter`, `object`, `output`, `progress`, `select`, `textarea`
		 *
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Applies to `button`, `form`, `fieldset`, `iframe`, `input`, `keygen`, `object`, `output`, `select`, `textarea`, `map`, `meta`, `param`
		 *
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
	};
	font: {
		/**
		 * Applies to `basefont`, `font`, `hr`
		 *
		 * This attribute sets the text color using either a named color or a color specified in the hexadecimal #RRGGBB format.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS color property instead.
		 */
		color: string;
	};
	form: {
		/**
		 * Applies to `form`, `input`
		 *
		 * List of types the server accepts, typically a file type.
		 */
		accept: string;
		/**
		 * Applies to `form`
		 *
		 * List of supported charsets.
		 */
		["accept-charset"]: string;
		/**
		 * Applies to `form`
		 *
		 * The URI of a program that processes the information submitted via the form.
		 */
		action: string;
		/**
		 * Applies to `form`, `input`, `select`, `textarea`
		 *
		 * Indicates whether controls in this form can by default have their values automatically completed by the browser.
		 */
		autocomplete: string;
		/**
		 * Applies to `form`
		 *
		 * Defines the content type of the form data when the method is POST.
		 */
		enctype: string;
		/**
		 * Applies to `form`
		 *
		 * Defines which HTTP method to use when submitting the form. Can be GET (default) or POST.
		 */
		method: string;
		/**
		 * Applies to `button`, `form`, `fieldset`, `iframe`, `input`, `keygen`, `object`, `output`, `select`, `textarea`, `map`, `meta`, `param`
		 *
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
		/**
		 * Applies to `form`
		 *
		 * This attribute indicates that the form shouldn't be validated when submitted.
		 */
		novalidate: string;
		/**
		 * Applies to `a`, `area`, `base`, `form`
		 *
		 * Specifies where to open the linked document (in the case of an `<a>` element) or where to display the response received (in the case of a `<form>` element)
		 */
		target: string;
	};
	hr: {
		/**
		 * Applies to `applet`, `caption`, `col`, `colgroup`, `hr`, `iframe`, `img`, `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `tr`
		 *
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Applies to `basefont`, `font`, `hr`
		 *
		 * This attribute sets the text color using either a named color or a color specified in the hexadecimal #RRGGBB format.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS color property instead.
		 */
		color: string;
	};
	iframe: {
		/**
		 * Applies to `applet`, `caption`, `col`, `colgroup`, `hr`, `iframe`, `img`, `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `tr`
		 *
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Applies to `iframe`
		 *
		 * Specifies a feature-policy for the iframe.
		 */
		allow: string;
		/**
		 * Applies to `iframe`
		 *
		 * Specifies the Content Security Policy that an embedded document must agree to enforce upon itself.
		 */
		csp: string;
		/**
		 * Applies to `canvas`, `embed`, `iframe`, `img`, `input`, `object`, `video`
		 *
		 * Specifies the height of elements listed here. For all other elements, use the CSS height property.
		 *
		 * > Note: In some instances, such as `<div>`, this is a legacy attribute, in which case the CSS height property should be used instead.
		 */
		height: string;
		/**
		 * Applies to `iframe`, `img`, `link`, `script`
		 *
		 * Indicates the relative fetch priority for the resource.
		 */
		importance: string;
		/**
		 * Applies to `img`, `iframe`
		 *
		 * Indicates if the element should be loaded lazily (loading="lazy") or loaded immediately (loading="eager").
		 *
		 * WIP: WHATWG PR #3752
		 */
		loading: string;
		/**
		 * Applies to `button`, `form`, `fieldset`, `iframe`, `input`, `keygen`, `object`, `output`, `select`, `textarea`, `map`, `meta`, `param`
		 *
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
		/**
		 * Applies to `a`, `area`, `iframe`, `img`, `link`, `script`
		 *
		 * Specifies which referrer is sent when fetching the resource.
		 */
		referrerpolicy: string;
		/**
		 * Applies to `iframe`
		 *
		 * Stops a document loaded in an iframe from using certain features (such as submitting forms or opening new windows).
		 */
		sandbox: string;
		/**
		 * Applies to `audio`, `embed`, `iframe`, `img`, `input`, `script`, `source`, `track`, `video`
		 *
		 * The URL of the embeddable content.
		 */
		src: string;
		/**
		 * Applies to `iframe`
		 */
		srcdoc: string;
		/**
		 * Applies to `canvas`, `embed`, `iframe`, `img`, `input`, `object`, `video`
		 *
		 * For the elements listed here, this establishes the element's width.
		 *
		 * > Note: For all other instances, such as `<div>`, this is a legacy attribute, in which case the CSS width property should be used instead.
		 */
		width: string;
	};
	img: {
		/**
		 * Applies to `applet`, `caption`, `col`, `colgroup`, `hr`, `iframe`, `img`, `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `tr`
		 *
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Applies to `applet`, `area`, `img`, `input`
		 *
		 * Alternative text in case an image can't be displayed.
		 */
		alt: string;
		/**
		 * Applies to `img`, `object`, `table`
		 *
		 * The border width.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS border property instead.
		 */
		border: string;
		/**
		 * Applies to `audio`, `img`, `link`, `script`, `video`
		 *
		 * How the element handles cross-origin requests
		 */
		crossorigin: string;
		/**
		 * Applies to `img`
		 *
		 * Indicates the preferred method to decode the image.
		 */
		decoding: string;
		/**
		 * Applies to `canvas`, `embed`, `iframe`, `img`, `input`, `object`, `video`
		 *
		 * Specifies the height of elements listed here. For all other elements, use the CSS height property.
		 *
		 * > Note: In some instances, such as `<div>`, this is a legacy attribute, in which case the CSS height property should be used instead.
		 */
		height: string;
		/**
		 * Applies to `iframe`, `img`, `link`, `script`
		 *
		 * Indicates the relative fetch priority for the resource.
		 */
		importance: string;
		/**
		 * Applies to `img`
		 *
		 * Indicates that the image is part of a server-side image map.
		 */
		ismap: string;
		/**
		 * Applies to `img`, `iframe`
		 *
		 * Indicates if the element should be loaded lazily (loading="lazy") or loaded immediately (loading="eager").
		 *
		 * WIP: WHATWG PR #3752
		 */
		loading: string;
		/**
		 * Applies to `a`, `area`, `iframe`, `img`, `link`, `script`
		 *
		 * Specifies which referrer is sent when fetching the resource.
		 */
		referrerpolicy: string;
		/**
		 * Applies to `link`, `img`, `source`
		 */
		sizes: string;
		/**
		 * Applies to `audio`, `embed`, `iframe`, `img`, `input`, `script`, `source`, `track`, `video`
		 *
		 * The URL of the embeddable content.
		 */
		src: string;
		/**
		 * Applies to `img`, `source`
		 *
		 * One or more responsive image candidates.
		 */
		srcset: string;
		/**
		 * Applies to `img`, `input`, `object`
		 */
		usemap: string;
		/**
		 * Applies to `canvas`, `embed`, `iframe`, `img`, `input`, `object`, `video`
		 *
		 * For the elements listed here, this establishes the element's width.
		 *
		 * > Note: For all other instances, such as `<div>`, this is a legacy attribute, in which case the CSS width property should be used instead.
		 */
		width: string;
	};
	input: {
		/**
		 * Applies to `form`, `input`
		 *
		 * List of types the server accepts, typically a file type.
		 */
		accept: string;
		/**
		 * Applies to `applet`, `area`, `img`, `input`
		 *
		 * Alternative text in case an image can't be displayed.
		 */
		alt: string;
		/**
		 * Applies to `form`, `input`, `select`, `textarea`
		 *
		 * Indicates whether controls in this form can by default have their values automatically completed by the browser.
		 */
		autocomplete: string;
		/**
		 * Applies to `button`, `input`, `keygen`, `select`, `textarea`
		 *
		 * The element should be automatically focused after the page loaded.
		 */
		autofocus: string;
		/**
		 * Applies to `input`
		 *
		 * From the HTML Media CaptureThe definition of 'media capture' in that specification.spec, specifies a new file can be captured.
		 */
		capture: string;
		/**
		 * Applies to `command`, `input`
		 *
		 * Indicates whether the element should be checked on page load.
		 */
		checked: string;
		/**
		 * Applies to `input`, `textarea`
		 */
		dirname: string;
		/**
		 * Applies to `button`, `command`, `fieldset`, `input`, `keygen`, `optgroup`, `option`, `select`, `textarea`
		 *
		 * Indicates whether the user can interact with the element.
		 */
		disabled: string;
		/**
		 * Applies to `button`, `fieldset`, `input`, `keygen`, `label`, `meter`, `object`, `output`, `progress`, `select`, `textarea`
		 *
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Applies to `input`, `button`
		 *
		 * Indicates the action of the element, overriding the action defined in the `<form>`.
		 */
		formaction: string;
		/**
		 * Applies to `button`, `input`
		 *
		 * If the button/input is a submit button (type="submit"), this attribute sets the encoding type to use during form submission. If this attribute is specified, it overrides the enctype attribute of the button's form owner.
		 */
		formenctype: string;
		/**
		 * Applies to `button`, `input`
		 *
		 * If the button/input is a submit button (type="submit"), this attribute sets the submission method to use during form submission (GET, POST, etc.). If this attribute is specified, it overrides the method attribute of the button's form owner.
		 */
		formmethod: string;
		/**
		 * Applies to `button`, `input`
		 *
		 * If the button/input is a submit button (type="submit"), this boolean attribute specifies that the form is not to be validated when it is submitted. If this attribute is specified, it overrides the novalidate attribute of the button's form owner.
		 */
		formnovalidate: string;
		/**
		 * Applies to `button`, `input`
		 *
		 * If the button/input is a submit button (type="submit"), this attribute specifies the browsing context (for example, tab, window, or inline frame) in which to display the response that is received after submitting the form. If this attribute is specified, it overrides the target attribute of the button's form owner.
		 */
		formtarget: string;
		/**
		 * Applies to `canvas`, `embed`, `iframe`, `img`, `input`, `object`, `video`
		 *
		 * Specifies the height of elements listed here. For all other elements, use the CSS height property.
		 *
		 * > Note: In some instances, such as `<div>`, this is a legacy attribute, in which case the CSS height property should be used instead.
		 */
		height: string;
		/**
		 * Applies to `input`
		 *
		 * Identifies a list of pre-defined options to suggest to the user.
		 */
		list: string;
		/**
		 * Applies to `input`, `meter`, `progress`
		 *
		 * Indicates the maximum value allowed.
		 */
		max: string;
		/**
		 * Applies to `input`, `textarea`
		 *
		 * Defines the maximum number of characters allowed in the element.
		 */
		maxlength: string;
		/**
		 * Applies to `input`, `meter`
		 *
		 * Indicates the minimum value allowed.
		 */
		min: string;
		/**
		 * Applies to `input`, `textarea`
		 *
		 * Defines the minimum number of characters allowed in the element.
		 */
		minlength: string;
		/**
		 * Applies to `input`, `select`
		 *
		 * Indicates whether multiple values can be entered in an input of the type email or file.
		 */
		multiple: string;
		/**
		 * Applies to `button`, `form`, `fieldset`, `iframe`, `input`, `keygen`, `object`, `output`, `select`, `textarea`, `map`, `meta`, `param`
		 *
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
		/**
		 * Applies to `input`
		 *
		 * Defines a regular expression which the element's value will be validated against.
		 */
		pattern: string;
		/**
		 * Applies to `input`, `textarea`
		 *
		 * Provides a hint to the user of what can be entered in the field.
		 */
		placeholder: string;
		/**
		 * Applies to `input`, `textarea`
		 *
		 * Indicates whether the element can be edited.
		 */
		readonly: string;
		/**
		 * Applies to `input`, `select`, `textarea`
		 *
		 * Indicates whether this element is required to fill out or not.
		 */
		required: string;
		/**
		 * Applies to `input`, `select`
		 *
		 * Defines the width of the element (in pixels). If the element's type attribute is text or password then it's the number of characters.
		 */
		size: string;
		/**
		 * Applies to `audio`, `embed`, `iframe`, `img`, `input`, `script`, `source`, `track`, `video`
		 *
		 * The URL of the embeddable content.
		 */
		src: string;
		/**
		 * Applies to `input`
		 */
		step: string;
		/**
		 * Applies to `button`, `input`, `command`, `embed`, `object`, `script`, `source`, `style`, `menu`
		 *
		 * Defines the type of the element.
		 */
		type: string;
		/**
		 * Applies to `img`, `input`, `object`
		 */
		usemap: string;
		/**
		 * Applies to `button`, `data`, `input`, `li`, `meter`, `option`, `progress`, `param`
		 *
		 * Defines a default value which will be displayed in the element on page load.
		 */
		value: string;
		/**
		 * Applies to `canvas`, `embed`, `iframe`, `img`, `input`, `object`, `video`
		 *
		 * For the elements listed here, this establishes the element's width.
		 *
		 * > Note: For all other instances, such as `<div>`, this is a legacy attribute, in which case the CSS width property should be used instead.
		 */
		width: string;
	};
	ins: {
		/**
		 * Applies to `blockquote`, `del`, `ins`, `q`
		 *
		 * Contains a URI which points to the source of the quote or change.
		 */
		cite: string;
		/**
		 * Applies to `del`, `ins`, `time`
		 *
		 * Indicates the date and time associated with the element.
		 */
		datetime: string;
	};
	keygen: {
		/**
		 * Applies to `button`, `input`, `keygen`, `select`, `textarea`
		 *
		 * The element should be automatically focused after the page loaded.
		 */
		autofocus: string;
		/**
		 * Applies to `keygen`
		 *
		 * A challenge string that is submitted along with the public key.
		 */
		challenge: string;
		/**
		 * Applies to `button`, `command`, `fieldset`, `input`, `keygen`, `optgroup`, `option`, `select`, `textarea`
		 *
		 * Indicates whether the user can interact with the element.
		 */
		disabled: string;
		/**
		 * Applies to `button`, `fieldset`, `input`, `keygen`, `label`, `meter`, `object`, `output`, `progress`, `select`, `textarea`
		 *
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Applies to `keygen`
		 *
		 * Specifies the type of key generated.
		 */
		keytype: string;
		/**
		 * Applies to `button`, `form`, `fieldset`, `iframe`, `input`, `keygen`, `object`, `output`, `select`, `textarea`, `map`, `meta`, `param`
		 *
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
	};
	label: {
		/**
		 * Applies to `label`, `output`
		 *
		 * Describes elements which belongs to this one.
		 */
		for: string;
		/**
		 * Applies to `button`, `fieldset`, `input`, `keygen`, `label`, `meter`, `object`, `output`, `progress`, `select`, `textarea`
		 *
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
	};
	li: {
		/**
		 * Applies to `button`, `data`, `input`, `li`, `meter`, `option`, `progress`, `param`
		 *
		 * Defines a default value which will be displayed in the element on page load.
		 */
		value: string;
	};
	link: {
		/**
		 * Applies to `audio`, `img`, `link`, `script`, `video`
		 *
		 * How the element handles cross-origin requests
		 */
		crossorigin: string;
		/**
		 * Applies to `a`, `area`, `base`, `link`
		 *
		 * The URL of a linked resource.
		 */
		href: string;
		/**
		 * Applies to `a`, `area`, `link`
		 *
		 * Specifies the language of the linked resource.
		 */
		hreflang: string;
		/**
		 * Applies to `iframe`, `img`, `link`, `script`
		 *
		 * Indicates the relative fetch priority for the resource.
		 */
		importance: string;
		/**
		 * Applies to `link`, `script`
		 *
		 * Specifies a Subresource Integrity value that allows browsers to verify what they fetch.
		 */
		integrity: string;
		/**
		 * Applies to `a`, `area`, `link`, `source`, `style`
		 *
		 * Specifies a hint of the media for which the linked resource was designed.
		 */
		media: string;
		/**
		 * Applies to `a`, `area`, `iframe`, `img`, `link`, `script`
		 *
		 * Specifies which referrer is sent when fetching the resource.
		 */
		referrerpolicy: string;
		/**
		 * Applies to `a`, `area`, `link`
		 *
		 * Specifies the relationship of the target object to the link object.
		 */
		rel: string;
		/**
		 * Applies to `link`, `img`, `source`
		 */
		sizes: string;
	};
	map: {
		/**
		 * Applies to `button`, `form`, `fieldset`, `iframe`, `input`, `keygen`, `object`, `output`, `select`, `textarea`, `map`, `meta`, `param`
		 *
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
	};
	marquee: {
		/**
		 * Applies to `body`, `col`, `colgroup`, `marquee`, `table`, `tbody`, `tfoot`, `td`, `th`, `tr`
		 *
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
		/**
		 * Applies to `audio`, `bgsound`, `marquee`, `video`
		 *
		 * Indicates whether the media should start playing from the start when it's finished.
		 */
		loop: string;
	};
	menu: {
		/**
		 * Applies to `button`, `input`, `command`, `embed`, `object`, `script`, `source`, `style`, `menu`
		 *
		 * Defines the type of the element.
		 */
		type: string;
	};
	meta: {
		/**
		 * Applies to `meta`, `script`
		 *
		 * Declares the character encoding of the page or script.
		 */
		charset: string;
		/**
		 * Applies to `meta`
		 *
		 * A value associated with http-equiv or name depending on the context.
		 */
		content: string;
		/**
		 * Applies to `meta`
		 *
		 * Defines a pragma directive.
		 */
		["http-equiv"]: string;
		/**
		 * Applies to `button`, `form`, `fieldset`, `iframe`, `input`, `keygen`, `object`, `output`, `select`, `textarea`, `map`, `meta`, `param`
		 *
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
	};
	meter: {
		/**
		 * Applies to `button`, `fieldset`, `input`, `keygen`, `label`, `meter`, `object`, `output`, `progress`, `select`, `textarea`
		 *
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Applies to `meter`
		 *
		 * Indicates the lower bound of the upper range.
		 */
		high: string;
		/**
		 * Applies to `meter`
		 *
		 * Indicates the upper bound of the lower range.
		 */
		low: string;
		/**
		 * Applies to `input`, `meter`, `progress`
		 *
		 * Indicates the maximum value allowed.
		 */
		max: string;
		/**
		 * Applies to `input`, `meter`
		 *
		 * Indicates the minimum value allowed.
		 */
		min: string;
		/**
		 * Applies to `meter`
		 *
		 * Indicates the optimal numeric value.
		 */
		optimum: string;
		/**
		 * Applies to `button`, `data`, `input`, `li`, `meter`, `option`, `progress`, `param`
		 *
		 * Defines a default value which will be displayed in the element on page load.
		 */
		value: string;
	};
	object: {
		/**
		 * Applies to `img`, `object`, `table`
		 *
		 * The border width.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS border property instead.
		 */
		border: string;
		/**
		 * Applies to `object`
		 *
		 * Specifies the URL of the resource.
		 */
		data: string;
		/**
		 * Applies to `button`, `fieldset`, `input`, `keygen`, `label`, `meter`, `object`, `output`, `progress`, `select`, `textarea`
		 *
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Applies to `canvas`, `embed`, `iframe`, `img`, `input`, `object`, `video`
		 *
		 * Specifies the height of elements listed here. For all other elements, use the CSS height property.
		 *
		 * > Note: In some instances, such as `<div>`, this is a legacy attribute, in which case the CSS height property should be used instead.
		 */
		height: string;
		/**
		 * Applies to `button`, `form`, `fieldset`, `iframe`, `input`, `keygen`, `object`, `output`, `select`, `textarea`, `map`, `meta`, `param`
		 *
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
		/**
		 * Applies to `button`, `input`, `command`, `embed`, `object`, `script`, `source`, `style`, `menu`
		 *
		 * Defines the type of the element.
		 */
		type: string;
		/**
		 * Applies to `img`, `input`, `object`
		 */
		usemap: string;
		/**
		 * Applies to `canvas`, `embed`, `iframe`, `img`, `input`, `object`, `video`
		 *
		 * For the elements listed here, this establishes the element's width.
		 *
		 * > Note: For all other instances, such as `<div>`, this is a legacy attribute, in which case the CSS width property should be used instead.
		 */
		width: string;
	};
	ol: {
		/**
		 * Applies to `ol`
		 *
		 * Indicates whether the list should be displayed in a descending order instead of a ascending.
		 */
		reversed: string;
		/**
		 * Applies to `ol`
		 *
		 * Defines the first number if other than 1.
		 */
		start: string;
	};
	optgroup: {
		/**
		 * Applies to `button`, `command`, `fieldset`, `input`, `keygen`, `optgroup`, `option`, `select`, `textarea`
		 *
		 * Indicates whether the user can interact with the element.
		 */
		disabled: string;
		/**
		 * Applies to `optgroup`, `option`, `track`
		 *
		 * Specifies a user-readable title of the element.
		 */
		label: string;
	};
	option: {
		/**
		 * Applies to `button`, `command`, `fieldset`, `input`, `keygen`, `optgroup`, `option`, `select`, `textarea`
		 *
		 * Indicates whether the user can interact with the element.
		 */
		disabled: string;
		/**
		 * Applies to `optgroup`, `option`, `track`
		 *
		 * Specifies a user-readable title of the element.
		 */
		label: string;
		/**
		 * Applies to `option`
		 *
		 * Defines a value which will be selected on page load.
		 */
		selected: string;
		/**
		 * Applies to `button`, `data`, `input`, `li`, `meter`, `option`, `progress`, `param`
		 *
		 * Defines a default value which will be displayed in the element on page load.
		 */
		value: string;
	};
	output: {
		/**
		 * Applies to `label`, `output`
		 *
		 * Describes elements which belongs to this one.
		 */
		for: string;
		/**
		 * Applies to `button`, `fieldset`, `input`, `keygen`, `label`, `meter`, `object`, `output`, `progress`, `select`, `textarea`
		 *
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Applies to `button`, `form`, `fieldset`, `iframe`, `input`, `keygen`, `object`, `output`, `select`, `textarea`, `map`, `meta`, `param`
		 *
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
	};
	param: {
		/**
		 * Applies to `button`, `form`, `fieldset`, `iframe`, `input`, `keygen`, `object`, `output`, `select`, `textarea`, `map`, `meta`, `param`
		 *
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
		/**
		 * Applies to `button`, `data`, `input`, `li`, `meter`, `option`, `progress`, `param`
		 *
		 * Defines a default value which will be displayed in the element on page load.
		 */
		value: string;
	};
	progress: {
		/**
		 * Applies to `button`, `fieldset`, `input`, `keygen`, `label`, `meter`, `object`, `output`, `progress`, `select`, `textarea`
		 *
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Applies to `input`, `meter`, `progress`
		 *
		 * Indicates the maximum value allowed.
		 */
		max: string;
		/**
		 * Applies to `button`, `data`, `input`, `li`, `meter`, `option`, `progress`, `param`
		 *
		 * Defines a default value which will be displayed in the element on page load.
		 */
		value: string;
	};
	q: {
		/**
		 * Applies to `blockquote`, `del`, `ins`, `q`
		 *
		 * Contains a URI which points to the source of the quote or change.
		 */
		cite: string;
	};
	script: {
		/**
		 * Applies to `script`
		 *
		 * Executes the script asynchronously.
		 */
		async: string;
		/**
		 * Applies to `meta`, `script`
		 *
		 * Declares the character encoding of the page or script.
		 */
		charset: string;
		/**
		 * Applies to `audio`, `img`, `link`, `script`, `video`
		 *
		 * How the element handles cross-origin requests
		 */
		crossorigin: string;
		/**
		 * Applies to `script`
		 *
		 * Indicates that the script should be executed after the page has been parsed.
		 */
		defer: string;
		/**
		 * Applies to `iframe`, `img`, `link`, `script`
		 *
		 * Indicates the relative fetch priority for the resource.
		 */
		importance: string;
		/**
		 * Applies to `link`, `script`
		 *
		 * Specifies a Subresource Integrity value that allows browsers to verify what they fetch.
		 */
		integrity: string;
		/**
		 * Applies to `a`, `area`, `iframe`, `img`, `link`, `script`
		 *
		 * Specifies which referrer is sent when fetching the resource.
		 */
		referrerpolicy: string;
		/**
		 * Applies to `audio`, `embed`, `iframe`, `img`, `input`, `script`, `source`, `track`, `video`
		 *
		 * The URL of the embeddable content.
		 */
		src: string;
		/**
		 * Applies to `button`, `input`, `command`, `embed`, `object`, `script`, `source`, `style`, `menu`
		 *
		 * Defines the type of the element.
		 */
		type: string;
	};
	select: {
		/**
		 * Applies to `form`, `input`, `select`, `textarea`
		 *
		 * Indicates whether controls in this form can by default have their values automatically completed by the browser.
		 */
		autocomplete: string;
		/**
		 * Applies to `button`, `input`, `keygen`, `select`, `textarea`
		 *
		 * The element should be automatically focused after the page loaded.
		 */
		autofocus: string;
		/**
		 * Applies to `button`, `command`, `fieldset`, `input`, `keygen`, `optgroup`, `option`, `select`, `textarea`
		 *
		 * Indicates whether the user can interact with the element.
		 */
		disabled: string;
		/**
		 * Applies to `button`, `fieldset`, `input`, `keygen`, `label`, `meter`, `object`, `output`, `progress`, `select`, `textarea`
		 *
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Applies to `input`, `select`
		 *
		 * Indicates whether multiple values can be entered in an input of the type email or file.
		 */
		multiple: string;
		/**
		 * Applies to `button`, `form`, `fieldset`, `iframe`, `input`, `keygen`, `object`, `output`, `select`, `textarea`, `map`, `meta`, `param`
		 *
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
		/**
		 * Applies to `input`, `select`, `textarea`
		 *
		 * Indicates whether this element is required to fill out or not.
		 */
		required: string;
		/**
		 * Applies to `input`, `select`
		 *
		 * Defines the width of the element (in pixels). If the element's type attribute is text or password then it's the number of characters.
		 */
		size: string;
	};
	source: {
		/**
		 * Applies to `a`, `area`, `link`, `source`, `style`
		 *
		 * Specifies a hint of the media for which the linked resource was designed.
		 */
		media: string;
		/**
		 * Applies to `link`, `img`, `source`
		 */
		sizes: string;
		/**
		 * Applies to `audio`, `embed`, `iframe`, `img`, `input`, `script`, `source`, `track`, `video`
		 *
		 * The URL of the embeddable content.
		 */
		src: string;
		/**
		 * Applies to `img`, `source`
		 *
		 * One or more responsive image candidates.
		 */
		srcset: string;
		/**
		 * Applies to `button`, `input`, `command`, `embed`, `object`, `script`, `source`, `style`, `menu`
		 *
		 * Defines the type of the element.
		 */
		type: string;
	};
	style: {
		/**
		 * Applies to `a`, `area`, `link`, `source`, `style`
		 *
		 * Specifies a hint of the media for which the linked resource was designed.
		 */
		media: string;
		/**
		 * Applies to `button`, `input`, `command`, `embed`, `object`, `script`, `source`, `style`, `menu`
		 *
		 * Defines the type of the element.
		 */
		type: string;
	};
	table: {
		/**
		 * Applies to `applet`, `caption`, `col`, `colgroup`, `hr`, `iframe`, `img`, `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `tr`
		 *
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Applies to `body`, `table`, `td`, `th`
		 *
		 * Specifies the URL of an image file.
		 *
		 * > Note: Although browsers and email clients may still support this attribute, it is obsolete. Use CSS background-image instead.
		 */
		background: string;
		/**
		 * Applies to `body`, `col`, `colgroup`, `marquee`, `table`, `tbody`, `tfoot`, `td`, `th`, `tr`
		 *
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
		/**
		 * Applies to `img`, `object`, `table`
		 *
		 * The border width.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS border property instead.
		 */
		border: string;
	};
	tbody: {
		/**
		 * Applies to `applet`, `caption`, `col`, `colgroup`, `hr`, `iframe`, `img`, `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `tr`
		 *
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Applies to `body`, `col`, `colgroup`, `marquee`, `table`, `tbody`, `tfoot`, `td`, `th`, `tr`
		 *
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
	};
	td: {
		/**
		 * Applies to `applet`, `caption`, `col`, `colgroup`, `hr`, `iframe`, `img`, `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `tr`
		 *
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Applies to `body`, `table`, `td`, `th`
		 *
		 * Specifies the URL of an image file.
		 *
		 * > Note: Although browsers and email clients may still support this attribute, it is obsolete. Use CSS background-image instead.
		 */
		background: string;
		/**
		 * Applies to `body`, `col`, `colgroup`, `marquee`, `table`, `tbody`, `tfoot`, `td`, `th`, `tr`
		 *
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
		/**
		 * Applies to `td`, `th`
		 *
		 * The colspan attribute defines the number of columns a cell should span.
		 */
		colspan: string;
		/**
		 * Applies to `td`, `th`
		 *
		 * IDs of the `<th>` elements which applies to this element.
		 */
		headers: string;
		/**
		 * Applies to `td`, `th`
		 *
		 * Defines the number of rows a table cell should span over.
		 */
		rowspan: string;
	};
	textarea: {
		/**
		 * Applies to `form`, `input`, `select`, `textarea`
		 *
		 * Indicates whether controls in this form can by default have their values automatically completed by the browser.
		 */
		autocomplete: string;
		/**
		 * Applies to `button`, `input`, `keygen`, `select`, `textarea`
		 *
		 * The element should be automatically focused after the page loaded.
		 */
		autofocus: string;
		/**
		 * Applies to `textarea`
		 *
		 * Defines the number of columns in a textarea.
		 */
		cols: string;
		/**
		 * Applies to `input`, `textarea`
		 */
		dirname: string;
		/**
		 * Applies to `button`, `command`, `fieldset`, `input`, `keygen`, `optgroup`, `option`, `select`, `textarea`
		 *
		 * Indicates whether the user can interact with the element.
		 */
		disabled: string;
		/**
		 * Applies to `textarea`, `contenteditable`
		 *
		 * The enterkeyhint specifies what action label (or icon) to present for the enter key on virtual keyboards. The attribute can be used with form controls (such as the value of textarea elements), or in elements in an editing host (e.g., using contenteditable attribute).
		 */
		enterkeyhint: string;
		/**
		 * Applies to `button`, `fieldset`, `input`, `keygen`, `label`, `meter`, `object`, `output`, `progress`, `select`, `textarea`
		 *
		 * Indicates the form that is the owner of the element.
		 */
		form: string;
		/**
		 * Applies to `textarea`, `contenteditable`
		 *
		 * Provides a hint as to the type of data that might be entered by the user while editing the element or its contents. The attribute can be used with form controls (such as the value of textarea elements), or in elements in an editing host (e.g., using contenteditable attribute).
		 */
		inputmode: string;
		/**
		 * Applies to `input`, `textarea`
		 *
		 * Defines the maximum number of characters allowed in the element.
		 */
		maxlength: string;
		/**
		 * Applies to `input`, `textarea`
		 *
		 * Defines the minimum number of characters allowed in the element.
		 */
		minlength: string;
		/**
		 * Applies to `button`, `form`, `fieldset`, `iframe`, `input`, `keygen`, `object`, `output`, `select`, `textarea`, `map`, `meta`, `param`
		 *
		 * Name of the element. For example used by the server to identify the fields in form submits.
		 */
		name: string;
		/**
		 * Applies to `input`, `textarea`
		 *
		 * Provides a hint to the user of what can be entered in the field.
		 */
		placeholder: string;
		/**
		 * Applies to `input`, `textarea`
		 *
		 * Indicates whether the element can be edited.
		 */
		readonly: string;
		/**
		 * Applies to `input`, `select`, `textarea`
		 *
		 * Indicates whether this element is required to fill out or not.
		 */
		required: string;
		/**
		 * Applies to `textarea`
		 *
		 * Defines the number of rows in a text area.
		 */
		rows: string;
		/**
		 * Applies to `textarea`
		 *
		 * Indicates whether the text should be wrapped.
		 */
		wrap: string;
	};
	tfoot: {
		/**
		 * Applies to `applet`, `caption`, `col`, `colgroup`, `hr`, `iframe`, `img`, `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `tr`
		 *
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Applies to `body`, `col`, `colgroup`, `marquee`, `table`, `tbody`, `tfoot`, `td`, `th`, `tr`
		 *
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
	};
	th: {
		/**
		 * Applies to `applet`, `caption`, `col`, `colgroup`, `hr`, `iframe`, `img`, `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `tr`
		 *
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Applies to `body`, `table`, `td`, `th`
		 *
		 * Specifies the URL of an image file.
		 *
		 * > Note: Although browsers and email clients may still support this attribute, it is obsolete. Use CSS background-image instead.
		 */
		background: string;
		/**
		 * Applies to `body`, `col`, `colgroup`, `marquee`, `table`, `tbody`, `tfoot`, `td`, `th`, `tr`
		 *
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
		/**
		 * Applies to `td`, `th`
		 *
		 * The colspan attribute defines the number of columns a cell should span.
		 */
		colspan: string;
		/**
		 * Applies to `td`, `th`
		 *
		 * IDs of the `<th>` elements which applies to this element.
		 */
		headers: string;
		/**
		 * Applies to `td`, `th`
		 *
		 * Defines the number of rows a table cell should span over.
		 */
		rowspan: string;
		/**
		 * Applies to `th`
		 *
		 * Defines the cells that the header test (defined in the th element) relates to.
		 */
		scope: string;
	};
	thead: {
		/**
		 * Applies to `applet`, `caption`, `col`, `colgroup`, `hr`, `iframe`, `img`, `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `tr`
		 *
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
	};
	time: {
		/**
		 * Applies to `del`, `ins`, `time`
		 *
		 * Indicates the date and time associated with the element.
		 */
		datetime: string;
	};
	tr: {
		/**
		 * Applies to `applet`, `caption`, `col`, `colgroup`, `hr`, `iframe`, `img`, `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `tr`
		 *
		 * Specifies the horizontal alignment of the element.
		 */
		align: string;
		/**
		 * Applies to `body`, `col`, `colgroup`, `marquee`, `table`, `tbody`, `tfoot`, `td`, `th`, `tr`
		 *
		 * Background color of the element.
		 *
		 * > Note: This is a legacy attribute. Please use the CSS background-color property instead.
		 */
		bgcolor: string;
	};
	track: {
		/**
		 * Applies to `track`
		 *
		 * Indicates that the track should be enabled unless the user's preferences indicate something different.
		 */
		default: string;
		/**
		 * Applies to `track`
		 *
		 * Specifies the kind of text track.
		 */
		kind: string;
		/**
		 * Applies to `optgroup`, `option`, `track`
		 *
		 * Specifies a user-readable title of the element.
		 */
		label: string;
		/**
		 * Applies to `audio`, `embed`, `iframe`, `img`, `input`, `script`, `source`, `track`, `video`
		 *
		 * The URL of the embeddable content.
		 */
		src: string;
		/**
		 * Applies to `track`
		 */
		srclang: string;
	};
	video: {
		/**
		 * Applies to `audio`, `video`
		 *
		 * The audio or video should play as soon as possible.
		 */
		autoplay: string;
		/**
		 * Applies to `audio`, `video`
		 *
		 * Contains the time range of already buffered media.
		 */
		buffered: string;
		/**
		 * Applies to `audio`, `video`
		 *
		 * Indicates whether the browser should show playback controls to the user.
		 */
		controls: string;
		/**
		 * Applies to `audio`, `img`, `link`, `script`, `video`
		 *
		 * How the element handles cross-origin requests
		 */
		crossorigin: string;
		/**
		 * Applies to `canvas`, `embed`, `iframe`, `img`, `input`, `object`, `video`
		 *
		 * Specifies the height of elements listed here. For all other elements, use the CSS height property.
		 *
		 * > Note: In some instances, such as `<div>`, this is a legacy attribute, in which case the CSS height property should be used instead.
		 */
		height: string;
		/**
		 * Applies to `audio`, `bgsound`, `marquee`, `video`
		 *
		 * Indicates whether the media should start playing from the start when it's finished.
		 */
		loop: string;
		/**
		 * Applies to `audio`, `video`
		 *
		 * Indicates whether the audio will be initially silenced on page load.
		 */
		muted: string;
		/**
		 * Applies to `video`
		 *
		 * A URL indicating a poster frame to show until the user plays or seeks.
		 */
		poster: string;
		/**
		 * Applies to `audio`, `video`
		 *
		 * Indicates whether the whole resource, parts of it or nothing should be preloaded.
		 */
		preload: string;
		/**
		 * Applies to `audio`, `embed`, `iframe`, `img`, `input`, `script`, `source`, `track`, `video`
		 *
		 * The URL of the embeddable content.
		 */
		src: string;
		/**
		 * Applies to `canvas`, `embed`, `iframe`, `img`, `input`, `object`, `video`
		 *
		 * For the elements listed here, this establishes the element's width.
		 *
		 * > Note: For all other instances, such as `<div>`, this is a legacy attribute, in which case the CSS width property should be used instead.
		 */
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
			/**
			 * When the element lacks suitable ARIA-semantics, authors must
			 * assign an ARIA-role. Addition of ARIA semantics only exposes
			 * extra information to a browser's accessibility API, and does
			 * not affect a page's DOM.
			 * 
			 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques
			 */
			role?: AriaRoles;
			/**
			 * ARIA is a set of attributes that define ways to make web content
			 * and web applications (especially those developed with JavaScript)
			 * more accessible to people with disabilities.
			 * 
			 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA
			 */
			aria?: AriaAttributes;
		} & ElementAttrs[E]
	>;
