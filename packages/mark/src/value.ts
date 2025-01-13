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

	ctx.consume(); // consume the closing quote
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

	if (ctx.not("[")) return undefined;
	ctx.consume(); // consume the opening bracket

	let first = true;
	while (ctx.not("]")) {
		ctx.nomnomnom();

		if (ctx.eof()) return revert();

		// expect a comma if not the first value
		// trailing commas are supported
		if (!first) if (!ctx.consume_if(",")) return revert();
		ctx.nomnomnom();

		const value = try_param_value(ctx);
		if (value === undefined) break;
		params.push(value);

		first = false;
	}

	if (!ctx.consume_if("]")) return revert();
	return params;
}

export function try_param_object(ctx: ParserContext): { [key: string]: Value } | undefined {
	const params: { [key: string]: Value } = {};

	if (ctx.not("{")) return undefined;
	ctx.consume(); // consume the opening bracket
	ctx.nomnomnom();

	let first = true;
	while (ctx.not("}")) {
		ctx.nomnomnom();

		if (ctx.eof()) throw ctx.error("}", "EOF");

		// expect a comma if not the first value
		// trailing commas are required at the moment
		// even empty objects are required to have a comma
		// TODO: fix this
		if (!first) ctx.expect(",");
		ctx.nomnomnom();

		const key = ident(ctx);
		// didn't find a key, could not parse an object
		if (!key) break;
		ctx.nomnomnom();

		ctx.expect(":");
		ctx.nomnomnom();

		const value = try_param_value(ctx);
		// didn't find a value, could not parse an object
		if (value === undefined) throw ctx.error("value", ctx.peek());
		params[key] = value;
		first = false;
	}

	if (ctx.not("}")) throw ctx.error("}", ctx.peek());
	ctx.consume(); // consume the closing bracket
	return params;
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
