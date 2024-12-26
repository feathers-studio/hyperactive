type QuerySpec = Record<string, boolean>;

// Maybe this should allow URLs without domains etc?
export class HyperURL<P, Q> extends URL {
	public route: string;
	public params: P;
	#query: QuerySpec;

	constructor({
		url,
		route,
		params,
		spec: { query },
	}: {
		url: string;
		route: string;
		params: P;
		spec: { query: QuerySpec };
	}) {
		super(url);

		this.route = route;
		this.params = params;
		this.#query = query;
	}

	get query() {
		const spec = this.#query;
		return [...this.searchParams.entries()].reduce((q, [k, v]) => {
			if (spec[k]) ((q[k] as string[]) || (q[k] = [])).push(v);
			else q[k] = v;
			return q;
		}, {} as Record<string, string | string[]>) as unknown as Q;
	}
}
