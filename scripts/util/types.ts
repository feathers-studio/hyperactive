export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export type AllUndef<U extends Record<string, unknown>> = { [x in keyof U]?: undefined };
export type Expand<T> = T extends object ? (T extends infer O ? { [K in keyof O]: O[K] } : never) : T;
export type EvenUnion<X> = Expand<{ [x in keyof X]: { [key in x]: X[x] } & AllUndef<Omit<X, x>> }[keyof X]>;
