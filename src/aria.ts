export type AriaRoles =
	| "alert"
	| "alertdialog"
	| "application"
	| "directory"
	| "document"
	| "feed"
	| "grid"
	| "gridcell"
	| "group"
	| "log"
	| "marquee"
	| "menu"
	| "menubar"
	| "menuitemcheckbox"
	| "menuitemradio"
	| "none"
	| "note"
	| "presentation"
	| "scrollbar"
	| "search"
	| "status"
	| "switch"
	| "tab"
	| "tablist"
	| "tabpanel"
	| "timer"
	| "toolbar"
	| "tooltip"
	| "tree"
	| "treegrid"
	| "treeitem";

export type AriaAttributes = Partial<{
	/**
	 * Identifies the currently active descendant of a composite widget.
	 */
	activedescendant: string;
	/**
	 * Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. See related aria-relevant.
	 */
	atomic: string;
	/**
	 * Indicates whether user input completion suggestions are provided.
	 */
	autocomplete: string;
	/**
	 * Indicates whether an element, and its subtree, are currently being updated.
	 */
	busy: string;
	/**
	 * Indicates the current "checked" state of checkboxes, radio buttons, and other widgets. See related aria-pressed and aria-selected.
	 */
	checked: string;
	/**
	 * Identifies the element (or elements) whose contents or presence are controlled by the current element. See related aria-owns.
	 */
	controls: string;
	/**
	 * Identifies the element (or elements) that describes the object. See related aria-labelledby.
	 */
	describedby: string;
	/**
	 * Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable. See related aria-hidden and aria-readonly.
	 */
	disabled: string;
	/**
	 * Indicates what functions can be performed when the dragged object is released on the drop target. This allows assistive technologies to convey the possible drag options available to users, including whether a pop-up menu of choices is provided by the application. Typically, drop effect functions can only be provided once an object has been grabbed for a drag operation as the drop effect functions available are dependent on the object being dragged.
	 */
	dropeffect: string;
	/**
	 * Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed.
	 */
	expanded: string;
	/**
	 * Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion, allows assistive technology to override the general default of reading in document source order.
	 */
	flowto: string;
	/**
	 * Indicates an element's "grabbed" state in a drag-and-drop operation.
	 */
	grabbed: string;
	/**
	 * Indicates that the element has a popup context menu or sub-level menu.
	 */
	haspopup: string;
	/**
	 * Indicates that the element and all of its descendants are not visible or perceivable to any user as implemented by the author. See related aria-disabled.
	 */
	hidden: string;
	/**
	 * Indicates the entered value does not conform to the format expected by the application.
	 */
	invalid: string;
	/**
	 * Defines a string value that labels the current element. See related aria-labelledby.
	 */
	label: string;
	/**
	 * Identifies the element (or elements) that labels the current element. See related aria-label and aria-describedby.
	 */
	labelledby: string;
	/**
	 * Defines the hierarchical level of an element within a structure.
	 */
	level: string;
	/**
	 * Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region.
	 */
	live: string;
	/**
	 * Indicates whether a text box accepts multiple lines of input or only a single line.
	 */
	multiline: string;
	/**
	 * Indicates that the user may select more than one item from the current selectable descendants.
	 */
	multiselectable: string;
	/**
	 * Indicates whether the element and orientation is horizontal or vertical.
	 */
	orientation: string;
	/**
	 * Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship between DOM elements where the DOM hierarchy cannot be used to represent the relationship. See related aria-controls.
	 */
	owns: string;
	/**
	 * Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM. See related aria-setsize.
	 */
	posinset: string;
	/**
	 * Indicates the current "pressed" state of toggle buttons. See related aria-checked and aria-selected.
	 */
	pressed: string;
	/**
	 * Indicates that the element is not editable, but is otherwise operable. See related aria-disabled.
	 */
	readonly: string;
	/**
	 * Indicates what user agent change notifications (additions, removals, etc.) assistive technologies will receive within a live region. See related aria-atomic.
	 */
	relevant: string;
	/**
	 * Indicates that user input is required on the element before a form may be submitted.
	 */
	required: string;
	/**
	 * Indicates the current "selected" state of various widgets. See related aria-checked and aria-pressed.
	 */
	selected: string;
	/**
	 * Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM. See related aria-posinset.
	 */
	setsize: string;
	/**
	 * Indicates if items in a table or grid are sorted in ascending or descending order.
	 */
	sort: string;
	/**
	 * Defines the maximum allowed value for a range widget.
	 */
	valuemax: string;
	/**
	 * Defines the minimum allowed value for a range widget.
	 */
	valuemin: string;
	/**
	 * Defines the current value for a range widget. See related aria-valuetext.
	 */
	valuenow: string;
	/**
	 * Defines the human readable text alternative of aria-valuenow for a range widget.
	 */
	valuetext: string;
}>;
