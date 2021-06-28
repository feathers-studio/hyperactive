export type ariaRoles =
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

export type ariaAttributes = Record<
	| "aria-activedescendant"
	| "aria-atomic"
	| "aria-autocomplete"
	| "aria-busy"
	| "aria-checked"
	| "aria-controls"
	| "aria-describedby"
	| "aria-disabled"
	| "aria-dropeffect"
	| "aria-expanded"
	| "aria-flowto"
	| "aria-grabbed"
	| "aria-haspopup"
	| "aria-hidden"
	| "aria-invalid"
	| "aria-label"
	| "aria-labelledby"
	| "aria-level"
	| "aria-live"
	| "aria-multiline"
	| "aria-multiselectable"
	| "aria-orientation"
	| "aria-owns"
	| "aria-posinset"
	| "aria-pressed"
	| "aria-readonly"
	| "aria-relevant"
	| "aria-required"
	| "aria-selected"
	| "aria-setsize"
	| "aria-sort"
	| "aria-valuemax"
	| "aria-valuemin"
	| "aria-valuenow"
	| "aria-valuetext",
	string
>;
