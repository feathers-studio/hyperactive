import type { Tag } from "./lib/tags.ts";
import type { Attributes as Attr } from "./lib/attributes.ts";
import { ReadonlyState } from "./state.ts";
import { AriaAttributes } from "./lib/aria.ts";
import { MaybeArray, MaybeState, MaybeString } from "./util.ts";

type Aria = { [K in keyof AriaAttributes]?: AriaAttributes[K] | ReadonlyState<AriaAttributes[K]> };

/** Re-export of Attributes with State support */
export type Attributes<T extends Tag> =
	{

	// prettier-ignore
	[K in keyof Attr<T>]?:
		  K extends "ref" | "on" ? Attr<T>[K]
		: K extends "aria" ? Aria
		: K extends "class" ? MaybeState<MaybeArray<MaybeString>>
		: Attr<T>[K] | ReadonlyState<Attr<T>[K]>;
	
	};
