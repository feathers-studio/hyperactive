import { HyperNodeish } from "./node";

export class Provider<T> {
	constructor(public readonly contextId: symbol, public readonly contextValue: T, public readonly contextualChild: HyperNodeish) {}
}

export class Consumer<T> {
	constructor(public readonly contextId: symbol, public readonly renderWithContext: (value: T) => HyperNodeish) {}
}