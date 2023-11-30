// This file was generated by hypertyper. Do not manually edit this file.

import { Tag } from "./tags.ts";
import { GlobalAttrs } from "./global-attributes.ts";
import { AriaRoles, AriaAttributes } from "./aria.ts";
import { HTMLElement, DOMEvents, HTMLElementTagNameMap } from "./dom.ts";

interface AAttributes {
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
	 * Specifies a hint of the media for which the linked resource was
	 * designed.
	 */
	media: string;
	/**
	 * The ping attribute specifies a space-separated list of URLs
	 * to be notified if a user follows the hyperlink.
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
	 * Specifies where to open the linked document (in the case of an
	 * `<a>` element) or where to display the response received
	 * (in the case of a `<form>` element)
	 */
	target: string;
};

interface AreaAttributes {
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
	 * Specifies a hint of the media for which the linked resource was
	 * designed.
	 */
	media: string;
	/**
	 * The ping attribute specifies a space-separated list of URLs
	 * to be notified if a user follows the hyperlink.
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
	 * Specifies where to open the linked document (in the case of an
	 * `<a>` element) or where to display the response received
	 * (in the case of a `<form>` element)
	 */
	target: string;
};

interface AudioAttributes {
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
	 * Indicates whether the media should start playing from the start when
	 * it's finished.
	 */
	loop: boolean;
	/**
	 * Indicates whether the audio will be initially silenced on page load.
	 */
	muted: boolean;
	/**
	 * Indicates whether the whole resource, parts of it or nothing should be
	 * preloaded.
	 */
	preload: "none" | "metadata" | "auto";
	/**
	 * The URL of the embeddable content.
	 */
	src: string;
};

interface BaseAttributes {
	/**
	 * The URL of a linked resource.
	 */
	href: string;
	/**
	 * Specifies where to open the linked document (in the case of an
	 * `<a>` element) or where to display the response received
	 * (in the case of a `<form>` element)
	 */
	target: string;
};

interface BlockquoteAttributes {
	/**
	 * Contains a URI which points to the source of the quote or change.
	 */
	cite: string;
};

interface BodyAttributes {
	/**
	 * Specifies the URL of an image file.
	 *
	 * > Note: Although browsers and email clients may still
	 * support this attribute, it is obsolete. Use CSS
	 * background-image instead.
	 */
	background: string;
	/**
	 * Background color of the element.
	 *
	 * > Note: This is a legacy attribute. Please use the
	 * CSS background-color property instead.
	 */
	bgcolor: string;
};

interface ButtonAttributes {
	/**
	 * Indicates whether the user can interact with the element.
	 */
	disabled: boolean;
	/**
	 * Indicates the form that is the owner of the element.
	 */
	form: string;
	/**
	 * Indicates the action of the element, overriding the action defined in
	 * the `<form>`.
	 */
	formaction: string;
	/**
	 * If the button/input is a submit button (e.g. type="submit"),
	 * this attribute sets the encoding type to use during form submission. If
	 * this attribute is specified, it overrides the
	 * enctype attribute of the button's
	 * form owner.
	 */
	formenctype: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
	/**
	 * If the button/input is a submit button (e.g. type="submit"),
	 * this attribute sets the submission method to use during form submission
	 * (GET, POST, etc.). If this attribute is
	 * specified, it overrides the method attribute of the
	 * button's form owner.
	 */
	formmethod: "GET" | "POST" | "dialog";
	/**
	 * If the button/input is a submit button (e.g. type="submit"),
	 * this boolean attribute specifies that the form is not to be validated
	 * when it is submitted. If this attribute is specified, it overrides the
	 * novalidate attribute of the button's
	 * form owner.
	 */
	formnovalidate: boolean;
	/**
	 * If the button/input is a submit button (e.g. type="submit"),
	 * this attribute specifies the browsing context (for example, tab, window,
	 * or inline frame) in which to display the response that is received after
	 * submitting the form. If this attribute is specified, it overrides the
	 * target attribute of the button's
	 * form owner.
	 */
	formtarget: string;
	/**
	 * Name of the element. For example used by the server to identify the
	 * fields in form submits.
	 */
	name: string;
	/**
	 * Defines the type of the element.
	 */
	type: "submit" | "reset" | "button";
	/**
	 * Defines a default value which will be displayed in the element on page
	 * load.
	 */
	value: string;
};

interface CanvasAttributes {
	/**
	 * Specifies the height of the element.
	 */
	height: number;
	/**
	 * Specifies the width of the element.
	 */
	width: number;
};

interface ColAttributes {
	/**
	 * Background color of the element.
	 *
	 * > Note: This is a legacy attribute. Please use the
	 * CSS background-color property instead.
	 */
	bgcolor: string;
	span: string;
};

interface ColgroupAttributes {
	/**
	 * Background color of the element.
	 *
	 * > Note: This is a legacy attribute. Please use the
	 * CSS background-color property instead.
	 */
	bgcolor: string;
	span: string;
};

interface ContenteditableAttributes {
	/**
	 * The enterkeyhint
	 * specifies what action label (or icon) to present for the enter key on
	 * virtual keyboards. The attribute can be used with form controls (such as
	 * the value of textarea elements), or in elements in an
	 * editing host (e.g., using contenteditable attribute).
	 *
	 * @experimental
	 */
	enterkeyhint: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
	/**
	 * Provides a hint as to the type of data that might be entered by the user
	 * while editing the element or its contents. The attribute can be used
	 * with form controls (such as the value of
	 * textarea elements), or in elements in an editing host
	 * (e.g., using contenteditable attribute).
	 */
	inputmode: "none" | "text" | "tel" | "email" | "url" | "numeric" | "decimal" | "search";
};

interface DataAttributes {
	/**
	 * Defines a default value which will be displayed in the element on page
	 * load.
	 */
	value: string;
};

interface DelAttributes {
	/**
	 * Contains a URI which points to the source of the quote or change.
	 */
	cite: string;
	/**
	 * Indicates the date and time associated with the element.
	 */
	datetime: string;
};

interface DetailsAttributes {
	/**
	 * Indicates whether the contents are currently visible (in the case of
	 * a `<details>` element) or whether the dialog is active
	 * and can be interacted with (in the case of a
	 * `<dialog>` element).
	 */
	open: boolean;
};

interface DialogAttributes {
	/**
	 * Indicates whether the contents are currently visible (in the case of
	 * a `<details>` element) or whether the dialog is active
	 * and can be interacted with (in the case of a
	 * `<dialog>` element).
	 */
	open: boolean;
};

interface EmbedAttributes {
	/**
	 * Specifies the height of the element.
	 */
	height: number;
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
	width: number;
};

interface FieldsetAttributes {
	/**
	 * Indicates whether the user can interact with the element.
	 */
	disabled: boolean;
	/**
	 * Indicates the form that is the owner of the element.
	 */
	form: string;
	/**
	 * Name of the element. For example used by the server to identify the
	 * fields in form submits.
	 */
	name: string;
};

interface FontAttributes {
	/**
	 * This attribute sets the text color using either a named color or a
	 * color specified in the hexadecimal #RRGGBB format.
	 *
	 *
	 * > Note: This is a legacy attribute. Please use the
	 * CSS color property instead.
	 */
	color: string;
};

interface FormAttributes {
	/**
	 * List of types the server accepts, typically a file type.
	 */
	accept: string;
	/**
	 * List of supported charsets.
	 */
	["accept-charset"]: "UTF-8";
	/**
	 * The URI of a program that processes the information submitted via the
	 * form.
	 */
	action: string;
	/**
	 * Indicates whether controls in this form can by default have their values
	 * automatically completed by the browser.
	 */
	autocomplete: "on" | "off";
	/**
	 * Defines the content type of the form data when the
	 * method is POST.
	 */
	enctype: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
	/**
	 * Defines which HTTP method to use when
	 * submitting the form. Can be GET (default) or
	 * POST.
	 */
	method: "GET" | "POST" | "dialog";
	/**
	 * Name of the element. For example used by the server to identify the
	 * fields in form submits.
	 */
	name: string;
	/**
	 * This attribute indicates that the form shouldn't be validated when
	 * submitted.
	 */
	novalidate: boolean;
	/**
	 * Specifies where to open the linked document (in the case of an
	 * `<a>` element) or where to display the response received
	 * (in the case of a `<form>` element)
	 */
	target: string;
};

interface HrAttributes {
	/**
	 * This attribute sets the text color using either a named color or a
	 * color specified in the hexadecimal #RRGGBB format.
	 *
	 *
	 * > Note: This is a legacy attribute. Please use the
	 * CSS color property instead.
	 */
	color: string;
};

interface IframeAttributes {
	/**
	 * Specifies a feature-policy for the iframe.
	 */
	allow: string;
	/**
	 * Specifies the Content Security Policy that an embedded document must
	 * agree to enforce upon itself.
	 *
	 * @experimental
	 */
	csp: string;
	/**
	 * Specifies the height of the element.
	 */
	height: number;
	/**
	 * Indicates if the element should be loaded lazily
	 * (loading="lazy") or loaded immediately
	 * (loading="eager").
	 *
	 * @experimental
	 */
	loading: "lazy" | "eager";
	/**
	 * Name of the element. For example used by the server to identify the
	 * fields in form submits.
	 */
	name: string;
	/**
	 * Specifies which referrer is sent when fetching the resource.
	 */
	referrerpolicy: string;
	/**
	 * Stops a document loaded in an iframe from using certain features (such
	 * as submitting forms or opening new windows).
	 */
	sandbox: string;
	/**
	 * The URL of the embeddable content.
	 */
	src: string;
	srcdoc: string;
	/**
	 * Specifies the width of the element.
	 */
	width: number;
};

interface ImgAttributes {
	/**
	 * Alternative text in case an image can't be displayed.
	 */
	alt: string;
	/**
	 * The border width.
	 *
	 * > Note: This is a legacy attribute. Please use the
	 * CSS border property instead.
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
	height: number;
	/**
	 * Indicates that the image is part of a server-side image map.
	 */
	ismap: boolean;
	/**
	 * Indicates if the element should be loaded lazily
	 * (loading="lazy") or loaded immediately
	 * (loading="eager").
	 *
	 * @experimental
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
	width: number;
};

interface InputAttributes {
	/**
	 * List of types the server accepts, typically a file type.
	 */
	accept: string;
	/**
	 * Alternative text in case an image can't be displayed.
	 */
	alt: string;
	/**
	 * Indicates whether controls in this form can by default have their values
	 * automatically completed by the browser.
	 */
	autocomplete: "on" | "off";
	/**
	 * From the Media Capture specification,
	 * specifies a new file can be captured.
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
	 * Indicates the action of the element, overriding the action defined in
	 * the `<form>`.
	 */
	formaction: string;
	/**
	 * If the button/input is a submit button (e.g. type="submit"),
	 * this attribute sets the encoding type to use during form submission. If
	 * this attribute is specified, it overrides the
	 * enctype attribute of the button's
	 * form owner.
	 */
	formenctype: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
	/**
	 * If the button/input is a submit button (e.g. type="submit"),
	 * this attribute sets the submission method to use during form submission
	 * (GET, POST, etc.). If this attribute is
	 * specified, it overrides the method attribute of the
	 * button's form owner.
	 */
	formmethod: "GET" | "POST" | "dialog";
	/**
	 * If the button/input is a submit button (e.g. type="submit"),
	 * this boolean attribute specifies that the form is not to be validated
	 * when it is submitted. If this attribute is specified, it overrides the
	 * novalidate attribute of the button's
	 * form owner.
	 */
	formnovalidate: boolean;
	/**
	 * If the button/input is a submit button (e.g. type="submit"),
	 * this attribute specifies the browsing context (for example, tab, window,
	 * or inline frame) in which to display the response that is received after
	 * submitting the form. If this attribute is specified, it overrides the
	 * target attribute of the button's
	 * form owner.
	 */
	formtarget: string;
	/**
	 * Specifies the height of the element.
	 */
	height: number;
	/**
	 * Identifies a list of pre-defined options to suggest to the user.
	 */
	list: string;
	/**
	 * Indicates the maximum value allowed.
	 */
	max: number;
	/**
	 * Defines the maximum number of characters allowed in the element.
	 */
	maxlength: number;
	/**
	 * Indicates the minimum value allowed.
	 */
	min: number;
	/**
	 * Defines the minimum number of characters allowed in the element.
	 */
	minlength: number;
	/**
	 * Indicates whether multiple values can be entered in an input of the type
	 * email or file.
	 */
	multiple: boolean;
	/**
	 * Name of the element. For example used by the server to identify the
	 * fields in form submits.
	 */
	name: string;
	/**
	 * Defines a regular expression which the element's value will be validated
	 * against.
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
	 * Defines the width of the element (in pixels). If the element's
	 * type attribute is text or
	 * password then it's the number of characters.
	 */
	size: number;
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
	 * Defines a default value which will be displayed in the element on page
	 * load.
	 */
	value: string;
	/**
	 * Specifies the width of the element.
	 */
	width: number;
};

interface InsAttributes {
	/**
	 * Contains a URI which points to the source of the quote or change.
	 */
	cite: string;
	/**
	 * Indicates the date and time associated with the element.
	 */
	datetime: string;
};

interface LabelAttributes {
	/**
	 * Describes elements which belongs to this one.
	 */
	for: string;
	/**
	 * Indicates the form that is the owner of the element.
	 */
	form: string;
};

interface LiAttributes {
	/**
	 * Defines a default value which will be displayed in the element on page
	 * load.
	 */
	value: number;
};

interface LinkAttributes {
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
	 * Specifies a
	 * Subresource Integrity
	 * value that allows browsers to verify what they fetch.
	 */
	integrity: string;
	/**
	 * Specifies a hint of the media for which the linked resource was
	 * designed.
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
	/**
	 * Defines the type of the element.
	 */
	type: `${string}/${string}`;
};

interface MapAttributes {
	/**
	 * Name of the element. For example used by the server to identify the
	 * fields in form submits.
	 */
	name: string;
};

interface MarqueeAttributes {
	/**
	 * Background color of the element.
	 *
	 * > Note: This is a legacy attribute. Please use the
	 * CSS background-color property instead.
	 */
	bgcolor: string;
	/**
	 * Indicates whether the media should start playing from the start when
	 * it's finished.
	 */
	loop: boolean;
};

interface MenuAttributes {
	/**
	 * Defines the type of the element.
	 */
	type: string;
};

interface MetaAttributes {
	/**
	 * Declares the character encoding of the page or script.
	 */
	charset: "utf-8";
	/**
	 * A value associated with http-equiv or
	 * name depending on the context.
	 */
	content: string;
	/**
	 * Defines a pragma directive.
	 */
	["http-equiv"]: "content-type" | "default-style" | "refresh" | "x-ua-compatible" | "content-security-policy";
	/**
	 * Name of the element. For example used by the server to identify the
	 * fields in form submits.
	 */
	name: string;
};

interface MeterAttributes {
	/**
	 * Indicates the form that is the owner of the element.
	 */
	form: string;
	/**
	 * Indicates the lower bound of the upper range.
	 */
	high: number;
	/**
	 * Indicates the upper bound of the lower range.
	 */
	low: number;
	/**
	 * Indicates the maximum value allowed.
	 */
	max: number;
	/**
	 * Indicates the minimum value allowed.
	 */
	min: number;
	/**
	 * Indicates the optimal numeric value.
	 */
	optimum: number;
	/**
	 * Defines a default value which will be displayed in the element on page
	 * load.
	 */
	value: number;
};

interface ObjectAttributes {
	/**
	 * The border width.
	 *
	 * > Note: This is a legacy attribute. Please use the
	 * CSS border property instead.
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
	height: number;
	/**
	 * Name of the element. For example used by the server to identify the
	 * fields in form submits.
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
	width: number;
};

interface OlAttributes {
	/**
	 * Indicates whether the list should be displayed in a descending order
	 * instead of an ascending order.
	 */
	reversed: boolean;
	/**
	 * Defines the first number if other than 1.
	 */
	start: number;
	/**
	 * Defines the type of the element.
	 */
	type: "1" | "a" | "A" | "i" | "I";
};

interface OptgroupAttributes {
	/**
	 * Indicates whether the user can interact with the element.
	 */
	disabled: boolean;
	/**
	 * Specifies a user-readable title of the element.
	 */
	label: string;
};

interface OptionAttributes {
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
	 * Defines a default value which will be displayed in the element on page
	 * load.
	 */
	value: string;
};

interface OutputAttributes {
	/**
	 * Describes elements which belongs to this one.
	 */
	for: string;
	/**
	 * Indicates the form that is the owner of the element.
	 */
	form: string;
	/**
	 * Name of the element. For example used by the server to identify the
	 * fields in form submits.
	 */
	name: string;
};

interface ParamAttributes {
	/**
	 * Name of the element. For example used by the server to identify the
	 * fields in form submits.
	 */
	name: string;
	/**
	 * Defines a default value which will be displayed in the element on page
	 * load.
	 */
	value: string;
};

interface ProgressAttributes {
	/**
	 * Indicates the form that is the owner of the element.
	 */
	form: string;
	/**
	 * Indicates the maximum value allowed.
	 */
	max: number;
	/**
	 * Defines a default value which will be displayed in the element on page
	 * load.
	 */
	value: number;
};

interface QAttributes {
	/**
	 * Contains a URI which points to the source of the quote or change.
	 */
	cite: string;
};

interface ScriptAttributes {
	/**
	 * Executes the script asynchronously.
	 */
	async: boolean;
	/**
	 * How the element handles cross-origin requests
	 */
	crossorigin: "anonymous" | "use-credentials";
	/**
	 * Indicates that the script should be executed after the page has been
	 * parsed.
	 */
	defer: boolean;
	/**
	 * Specifies a
	 * Subresource Integrity
	 * value that allows browsers to verify what they fetch.
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
	type: "module" | "importmap" | `${string}/${string}`;
};

interface SelectAttributes {
	/**
	 * Indicates whether controls in this form can by default have their values
	 * automatically completed by the browser.
	 */
	autocomplete: "on" | "off";
	/**
	 * Indicates whether the user can interact with the element.
	 */
	disabled: boolean;
	/**
	 * Indicates the form that is the owner of the element.
	 */
	form: string;
	/**
	 * Indicates whether multiple values can be entered in an input of the type
	 * email or file.
	 */
	multiple: boolean;
	/**
	 * Name of the element. For example used by the server to identify the
	 * fields in form submits.
	 */
	name: string;
	/**
	 * Indicates whether this element is required to fill out or not.
	 */
	required: boolean;
	/**
	 * Defines the width of the element (in pixels). If the element's
	 * type attribute is text or
	 * password then it's the number of characters.
	 */
	size: number;
};

interface SourceAttributes {
	/**
	 * Specifies a hint of the media for which the linked resource was
	 * designed.
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

interface StyleAttributes {
	/**
	 * Specifies a hint of the media for which the linked resource was
	 * designed.
	 */
	media: string;
	/**
	 * Defines the type of the element.
	 */
	type: string;
};

interface TableAttributes {
	/**
	 * Specifies the URL of an image file.
	 *
	 * > Note: Although browsers and email clients may still
	 * support this attribute, it is obsolete. Use CSS
	 * background-image instead.
	 */
	background: string;
	/**
	 * Background color of the element.
	 *
	 * > Note: This is a legacy attribute. Please use the
	 * CSS background-color property instead.
	 */
	bgcolor: string;
	/**
	 * The border width.
	 *
	 * > Note: This is a legacy attribute. Please use the
	 * CSS border property instead.
	 */
	border: string;
};

interface TbodyAttributes {
	/**
	 * Background color of the element.
	 *
	 * > Note: This is a legacy attribute. Please use the
	 * CSS background-color property instead.
	 */
	bgcolor: string;
};

interface TdAttributes {
	/**
	 * Specifies the URL of an image file.
	 *
	 * > Note: Although browsers and email clients may still
	 * support this attribute, it is obsolete. Use CSS
	 * background-image instead.
	 */
	background: string;
	/**
	 * Background color of the element.
	 *
	 * > Note: This is a legacy attribute. Please use the
	 * CSS background-color property instead.
	 */
	bgcolor: string;
	/**
	 * The colspan attribute defines the number of columns a cell should span.
	 */
	colspan: number;
	/**
	 * IDs of the `<th>` elements which applies to this
	 * element.
	 */
	headers: string;
	/**
	 * Defines the number of rows a table cell should span over.
	 */
	rowspan: number;
};

interface TextareaAttributes {
	/**
	 * Indicates whether controls in this form can by default have their values
	 * automatically completed by the browser.
	 */
	autocomplete: "on" | "off";
	/**
	 * Defines the number of columns in a textarea.
	 */
	cols: number;
	dirname: string;
	/**
	 * Indicates whether the user can interact with the element.
	 */
	disabled: boolean;
	/**
	 * The enterkeyhint
	 * specifies what action label (or icon) to present for the enter key on
	 * virtual keyboards. The attribute can be used with form controls (such as
	 * the value of textarea elements), or in elements in an
	 * editing host (e.g., using contenteditable attribute).
	 *
	 * @experimental
	 */
	enterkeyhint: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
	/**
	 * Indicates the form that is the owner of the element.
	 */
	form: string;
	/**
	 * Provides a hint as to the type of data that might be entered by the user
	 * while editing the element or its contents. The attribute can be used
	 * with form controls (such as the value of
	 * textarea elements), or in elements in an editing host
	 * (e.g., using contenteditable attribute).
	 */
	inputmode: "none" | "text" | "tel" | "email" | "url" | "numeric" | "decimal" | "search";
	/**
	 * Defines the maximum number of characters allowed in the element.
	 */
	maxlength: number;
	/**
	 * Defines the minimum number of characters allowed in the element.
	 */
	minlength: number;
	/**
	 * Name of the element. For example used by the server to identify the
	 * fields in form submits.
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
	rows: number;
	/**
	 * Indicates whether the text should be wrapped.
	 */
	wrap: "soft" | "hard";
};

interface TfootAttributes {
	/**
	 * Background color of the element.
	 *
	 * > Note: This is a legacy attribute. Please use the
	 * CSS background-color property instead.
	 */
	bgcolor: string;
};

interface ThAttributes {
	/**
	 * Specifies the URL of an image file.
	 *
	 * > Note: Although browsers and email clients may still
	 * support this attribute, it is obsolete. Use CSS
	 * background-image instead.
	 */
	background: string;
	/**
	 * Background color of the element.
	 *
	 * > Note: This is a legacy attribute. Please use the
	 * CSS background-color property instead.
	 */
	bgcolor: string;
	/**
	 * The colspan attribute defines the number of columns a cell should span.
	 */
	colspan: number;
	/**
	 * IDs of the `<th>` elements which applies to this
	 * element.
	 */
	headers: string;
	/**
	 * Defines the number of rows a table cell should span over.
	 */
	rowspan: number;
	/**
	 * Defines the cells that the header test (defined in the
	 * th element) relates to.
	 */
	scope: "row" | "col" | "rowgroup" | "colgroup";
};

interface TimeAttributes {
	/**
	 * Indicates the date and time associated with the element.
	 */
	datetime: string;
};

interface TrAttributes {
	/**
	 * Background color of the element.
	 *
	 * > Note: This is a legacy attribute. Please use the
	 * CSS background-color property instead.
	 */
	bgcolor: string;
};

interface TrackAttributes {
	/**
	 * Indicates that the track should be enabled unless the user's preferences
	 * indicate something different.
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

interface VideoAttributes {
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
	height: number;
	/**
	 * Indicates whether the media should start playing from the start when
	 * it's finished.
	 */
	loop: boolean;
	/**
	 * Indicates whether the audio will be initially silenced on page load.
	 */
	muted: boolean;
	/**
	 * A Boolean attribute indicating that the video is to be played "inline"; that is, within the element's playback area. Note that the absence of this attribute does not imply that the video will always be played in fullscreen.
	 */
	playsinline: boolean;
	/**
	 * A URL indicating a poster frame to show until the user plays or seeks.
	 */
	poster: string;
	/**
	 * Indicates whether the whole resource, parts of it or nothing should be
	 * preloaded.
	 */
	preload: "none" | "metadata" | "auto";
	/**
	 * The URL of the embeddable content.
	 */
	src: string;
	/**
	 * Specifies the width of the element.
	 */
	width: number;
};

interface UniqueElementAttrs {
	a: AAttributes;
	area: AreaAttributes;
	audio: AudioAttributes;
	base: BaseAttributes;
	blockquote: BlockquoteAttributes;
	body: BodyAttributes;
	button: ButtonAttributes;
	canvas: CanvasAttributes;
	col: ColAttributes;
	colgroup: ColgroupAttributes;
	contenteditable: ContenteditableAttributes;
	data: DataAttributes;
	del: DelAttributes;
	details: DetailsAttributes;
	dialog: DialogAttributes;
	embed: EmbedAttributes;
	fieldset: FieldsetAttributes;
	font: FontAttributes;
	form: FormAttributes;
	hr: HrAttributes;
	iframe: IframeAttributes;
	img: ImgAttributes;
	input: InputAttributes;
	ins: InsAttributes;
	label: LabelAttributes;
	li: LiAttributes;
	link: LinkAttributes;
	map: MapAttributes;
	marquee: MarqueeAttributes;
	menu: MenuAttributes;
	meta: MetaAttributes;
	meter: MeterAttributes;
	object: ObjectAttributes;
	ol: OlAttributes;
	optgroup: OptgroupAttributes;
	option: OptionAttributes;
	output: OutputAttributes;
	param: ParamAttributes;
	progress: ProgressAttributes;
	q: QAttributes;
	script: ScriptAttributes;
	select: SelectAttributes;
	source: SourceAttributes;
	style: StyleAttributes;
	table: TableAttributes;
	tbody: TbodyAttributes;
	td: TdAttributes;
	textarea: TextareaAttributes;
	tfoot: TfootAttributes;
	th: ThAttributes;
	time: TimeAttributes;
	tr: TrAttributes;
	track: TrackAttributes;
	video: VideoAttributes;
	[k: string]: unknown;
};

type PropOr<T, P extends string | symbol | number, D> = T extends Record<P, infer V> ? V : D;

type Deunionise<T> =
	| ([undefined] extends [T] ? undefined : never)
	| { [K in T extends unknown ? keyof T : never]: PropOr<NonNullable<T>, K, undefined> };

export type AllAttrs = Partial<Deunionise<UniqueElementAttrs[keyof UniqueElementAttrs]>>;

export type DataAttr = { [data in `data-${string}`]?: string };

type TagToHTMLElement<T extends Tag> = T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement;

interface Common<T extends Tag> {
	/**
	 * ref callback is called on mount of element with the DOM element.
	 */
	ref: (el: TagToHTMLElement<T>) => void;
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
}

export type Attr<T extends Tag = Tag> = Partial<GlobalAttrs & DataAttr & Common<T> & UniqueElementAttrs[T] & DOMEvents>;
