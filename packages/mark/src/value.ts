import type { Value } from "./types.ts";
import type { ParserContext } from "./Context.ts";

export function ident(ctx: ParserContext): string | undefined {
	let buffer = "";
	if (ctx.is(/^[A-Za-z_]$/)) buffer += ctx.consume();
	while (ctx.is(/^[A-Za-z0-9_-]$/)) buffer += ctx.consume();
	return buffer.length > 0 ? buffer : undefined;
}

export function try_param_string(ctx: ParserContext): string | undefined {
	const revert = ctx.checkpoint();

	const marker = ctx.consume_if('"') ?? ctx.consume_if("'");

	if (marker === undefined) return undefined;

	let buffer = "";
	while (true) {
		// if the next character is a backslash, escape the following character
		if (ctx.consume_if("\\")) {
			buffer += ctx.consume();
			continue;
		}

		// found the marker, consume it and complete the string
		if (ctx.consume_if(marker)) break;

		// found end of file or newline before closing quote
		if (ctx.eof() || ctx.is("\n")) return revert();

		buffer += ctx.consume();
	}

	return buffer;
}

export function try_param_number(ctx: ParserContext): number | undefined {
	const revert = ctx.checkpoint();
	let buffer = "";

	while (ctx.is(/^[0-9]$/)) buffer += ctx.consume();
	// if didn't find a number to parse
	if (buffer.length === 0) return revert();

	if (ctx.is(".")) {
		buffer += ctx.consume();
		let decimal = "";
		while (ctx.is(/^[0-9]$/)) decimal += ctx.consume();

		//if  only found a dot, not a decimal
		if (decimal.length === 0) return revert();

		buffer += "." + decimal;
	}

	return parseFloat(buffer);
}

export function try_param_null(ctx: ParserContext): null | undefined {
	if (ctx.consume_if("null")) return null;
	return undefined;
}

export function try_param_boolean(ctx: ParserContext): boolean | undefined {
	if (ctx.consume_if("true")) return true;
	if (ctx.consume_if("false")) return false;
	return undefined;
}

export function try_param_list(ctx: ParserContext): Value[] | undefined {
	const revert = ctx.checkpoint();

	const params: Value[] = [];

	if (!ctx.consume_if("[")) return undefined;

	// Whitespace is skipped before looking for the closing bracket, not after: checked
	// first, a `]` on its own line was never seen, and the list was rejected unless it
	// happened to end in a trailing comma.
	while (true) {
		ctx.nomnomnom();
		if (ctx.consume_if("]")) return params;
		if (ctx.eof()) return revert();

		if (params.length > 0) {
			if (!ctx.consume_if(",")) return revert();
			ctx.nomnomnom();
			if (ctx.consume_if("]")) return params; // a trailing comma
		}

		const value = try_param_value(ctx);
		if (value === undefined) return revert();
		params.push(value);
	}
}

export function try_param_object(ctx: ParserContext): { [key: string]: Value } | undefined {
	const revert = ctx.checkpoint();

	const params: { [key: string]: Value } = {};

	if (!ctx.consume_if("{")) return undefined;

	// Whitespace before the closer is skipped first, as in try_param_list.
	let first = true;
	while (true) {
		ctx.nomnomnom();
		if (ctx.consume_if("}")) return params;
		if (ctx.eof()) return revert();

		if (!first) {
			if (!ctx.consume_if(",")) return revert();
			ctx.nomnomnom();
			if (ctx.consume_if("}")) return params; // a trailing comma
		}

		const key = ident(ctx) ?? try_param_string(ctx);
		if (!key) return revert();
		ctx.nomnomnom();

		ctx.expect(":");
		ctx.nomnomnom();

		const value = try_param_value(ctx);
		if (value === undefined) return revert();
		params[key] = value;
		first = false;
	}
}

export function try_param_value(ctx: ParserContext): Value | undefined {
	let value: Value | undefined;

	if ((value = try_param_string(ctx)) !== undefined) return value;
	if ((value = try_param_number(ctx)) !== undefined) return value;
	if ((value = try_param_null(ctx)) !== undefined) return value;
	if ((value = try_param_boolean(ctx)) !== undefined) return value;
	if ((value = try_param_list(ctx)) !== undefined) return value;
	if ((value = try_param_object(ctx)) !== undefined) return value;
	return undefined;
}
