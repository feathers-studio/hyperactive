import { stat } from "node:fs/promises";

export const days = (n: number) => n * 60 * 60 * 24;
export const hours = (n: number) => n * 60 * 60;
export const minutes = (n: number) => n * 60;
export const seconds = (n: number) => n;

export async function generateETagFromFile(filePath: string): Promise<string> {
	const stats = await stat(filePath);
	const mtime = stats.mtime.getTime().toString();
	const size = stats.size.toString();
	const rawETag = `${mtime}-${size}`;

	const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawETag));
	const hashArray = new Uint8Array(hashBuffer);
	let hashHex = "";
	for (let i = 0; i < hashArray.length; i++) {
		hashHex += hashArray[i].toString(16).padStart(2, "0");
	}
	return `"${hashHex}"`;
}

export const redirect = (url: string, status: 301 | 302 = 302, headers: Record<string, string> = {}) =>
	new Response(null, { status, headers: { Location: url, ...headers } });

export const json = (body: any, status = 200, headers: Record<string, string> = {}) =>
	new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

export const html = (content: string, status = 200, headers: Record<string, string> = {}) =>
	new Response("<!DOCTYPE html>" + content, { status, headers: { "Content-Type": "text/html", ...headers } });
