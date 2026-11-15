/**
 * `value` with every node's `position` removed, for tests that compare structure.
 *
 * Positions have their own tests. Leaving them in would make every structural test
 * spell out where each node sits, or compare against hand-built nodes that have none.
 * Mutates and returns `value`.
 */
export function without_positions<T>(value: T): T {
	if (Array.isArray(value)) value.forEach(without_positions);
	else if (value !== null && typeof value === "object") {
		delete (value as { position?: unknown }).position;
		for (const inner of Object.values(value)) without_positions(inner);
	}
	return value;
}
