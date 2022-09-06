// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible. Do not rely on good formatting of values
// for AssertionError messages in browsers.

import { bold, gray, green, red, white } from "https://deno.land/std@0.99.0/fmt/colors.ts";
import { diff, DiffResult, DiffType } from "https://deno.land/std@0.99.0/testing/_diff.ts";

const CAN_NOT_DISPLAY = "[Cannot display]";

interface Constructor {
	// deno-lint-ignore no-explicit-any
	new (...args: any[]): any;
}

class AssertionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AssertionError";
	}
}

/**
 * Converts the input into a string. Objects, Sets and Maps are sorted so as to
 * make tests less flaky
 * @param v Value to be formatted
 */
function _format(v: unknown): string {
	return globalThis.Deno
		? Deno.inspect(v, {
				depth: Infinity,
				sorted: true,
				trailingComma: true,
				compact: false,
				iterableLimit: Infinity,
		  })
		: `"${String(v).replace(/(?=["\\])/g, "\\")}"`;
}

/**
 * Colors the output of assertion diffs
 * @param diffType Difference type, either added or removed
 */
function createColor(diffType: DiffType): (s: string) => string {
	switch (diffType) {
		case DiffType.added:
			return (s: string): string => green(bold(s));
		case DiffType.removed:
			return (s: string): string => red(bold(s));
		default:
			return white;
	}
}

/**
 * Prefixes `+` or `-` in diff output
 * @param diffType Difference type, either added or removed
 */
function createSign(diffType: DiffType): string {
	switch (diffType) {
		case DiffType.added:
			return "+   ";
		case DiffType.removed:
			return "-   ";
		default:
			return "    ";
	}
}

function buildMessage(diffResult: ReadonlyArray<DiffResult<string>>): string[] {
	const messages: string[] = [];
	messages.push("");
	messages.push("");
	messages.push(`    ${gray(bold("[Diff]"))} ${red(bold("Actual"))} / ${green(bold("Expected"))}`);
	messages.push("");
	messages.push("");
	diffResult.forEach((result: DiffResult<string>): void => {
		const c = createColor(result.type);
		messages.push(c(`${createSign(result.type)}${result.value}`));
	});
	messages.push("");

	return messages;
}

function isKeyedCollection(x: unknown): x is Set<unknown> {
	return [Symbol.iterator, "size"].every(k => k in (x as Set<unknown>));
}

/**
 * Deep equality comparison used in assertions
 * @param c actual value
 * @param d expected value
 */
function equal(c: unknown, d: unknown): boolean {
	const seen = new Map();
	return (function compare(a: unknown, b: unknown): boolean {
		// Have to render RegExp & Date for string comparison
		// unless it's mistreated as object
		if (a && b && ((a instanceof RegExp && b instanceof RegExp) || (a instanceof URL && b instanceof URL))) {
			return String(a) === String(b);
		}
		if (a instanceof Date && b instanceof Date) {
			const aTime = a.getTime();
			const bTime = b.getTime();
			// Check for NaN equality manually since NaN is not
			// equal to itself.
			if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
				return true;
			}
			return a.getTime() === b.getTime();
		}
		if (Object.is(a, b)) {
			return true;
		}
		if (a && typeof a === "object" && b && typeof b === "object") {
			if (seen.get(a) === b) {
				return true;
			}
			if (Object.keys(a || {}).length !== Object.keys(b || {}).length) {
				return false;
			}
			if (isKeyedCollection(a) && isKeyedCollection(b)) {
				if (a.size !== b.size) {
					return false;
				}

				let unmatchedEntries = a.size;

				for (const [aKey, aValue] of a.entries()) {
					for (const [bKey, bValue] of b.entries()) {
						/* Given that Map keys can be references, we need
						 * to ensure that they are also deeply equal */
						if (
							(aKey === aValue && bKey === bValue && compare(aKey, bKey)) ||
							(compare(aKey, bKey) && compare(aValue, bValue))
						) {
							unmatchedEntries--;
						}
					}
				}

				return unmatchedEntries === 0;
			}
			const merged = { ...a, ...b };
			for (const key of [...Object.getOwnPropertyNames(merged), ...Object.getOwnPropertySymbols(merged)]) {
				type Key = keyof typeof merged;
				if (!compare(a && a[key as Key], b && b[key as Key])) {
					return false;
				}
				if ((key in a && !(key in b)) || (key in b && !(key in a))) {
					return false;
				}
			}
			seen.set(a, b);
			return true;
		}
		return false;
	})(c, d);
}

/**
 * Make an assertion that `actual` and `expected` are equal, deeply. If not
 * deeply equal, then throw.
 *
 * Type parameter can be specified to ensure values under comparison have the same type.
 * For example:
 * ```ts
 * assertEquals<number>(1, 2)
 * ```
 */
export function assertEquals(actual: unknown, expected: unknown, msg?: string): void;
export function assertEquals<T>(actual: T, expected: T, msg?: string): void;
export function assertEquals(actual: unknown, expected: unknown, msg?: string): void {
	if (equal(actual, expected)) {
		return;
	}
	let message = "";
	const actualString = _format(actual);
	const expectedString = _format(expected);
	try {
		const diffResult = diff(actualString.split("\n"), expectedString.split("\n"));
		const diffMsg = buildMessage(diffResult).join("\n");
		message = `Values are not equal:\n${diffMsg}`;
	} catch {
		message = `\n${red(CAN_NOT_DISPLAY)} + \n\n`;
	}
	if (msg) {
		message = msg;
	}
	throw new AssertionError(message);
}
