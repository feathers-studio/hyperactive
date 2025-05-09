import { HyperNodeish } from "./node.ts";
import { randId } from "./util.ts";
import * as ContextInternal from "./context.internal.ts";

export class Context<T> {
	id: symbol;

	constructor(public readonly defaultCtx: () => T, public readonly name: string = randId()) {
		this.id = Symbol(name);
	}

	provider(value: T, child: HyperNodeish) {
		return new ContextInternal.Provider(this.id, value, child);
	}

	with(fn: (value: T) => HyperNodeish) {
		return new ContextInternal.Consumer(this.id, fn);
	}

	static isContext(x: any): x is ContextInternal.Provider<any> | ContextInternal.Consumer<any> {
		return x instanceof ContextInternal.Provider || x instanceof ContextInternal.Consumer;
	}
}
