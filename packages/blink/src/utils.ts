import { meta as meta_tag } from "@hyperactive/hyper/elements";
import { JSDOM } from "jsdom";
import { stat } from "node:fs/promises";
import { html as html_tag } from "@hyperactive/hyper/elements";
import { renderHTML, type HyperNode } from "@hyperactive/hyper";

export const ellipses = (text: string, maxLength: number) =>
	text.length > maxLength ? text.slice(0, maxLength - 3) + "..." : text;

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

type AllDefined<T> = { [K in keyof T]: NonNullable<T[K]> };

const filterUndefined = <T extends Record<string, string | undefined>>(obj: T) =>
	Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined)) as AllDefined<T>;

export const redirectClear = (url: string, headers: Record<string, string> = {}) =>
	redirect(url, { "Set-Cookie": `token=; Max-Age=0; HttpOnly; Secure; SameSite=Strict`, ...headers });

export const redirect = (
	url: string,
	headers: Record<string, string> = {},
	searchParams: Record<string, string | undefined> = {},
) =>
	new Response(null, {
		status: 302,
		headers: {
			Location: url + "?" + new URLSearchParams(filterUndefined(searchParams)),
			...headers,
		},
	});

export const html =
	(...elements: Parameters<typeof html_tag>) =>
	(headers: Record<string, string> = {}) =>
		new Response("<!DOCTYPE html>" + renderHTML(html_tag(...elements)), {
			headers: { "Content-Type": "text/html", ...headers },
		});

export interface Meta {
	title?: string | null;
	description?: string | null;
	meta_title?: string | null;
	meta_description?: string | null;
	meta_image?: string | null;
}

export async function fetchMeta(url: string): Promise<Meta> {
	const u = new URL(url);

	if (u.protocol === "magnet:") {
		const title = u.searchParams.get("dn") ?? "Magnet URI";
		const description = u.searchParams.get("xt");
		return {
			title,
			description,
			meta_title: title,
			meta_description: description,
			meta_image: null,
		};
	}

	if (["http:", "https:"].includes(u.protocol)) {
		try {
			const response = await fetch(u);
			const html = await response.text();
			const dom = new JSDOM(html);
			const doc = dom.window.document;

			const title = doc.querySelector("title")?.textContent;
			const description = doc.querySelector("meta[name='description']")?.getAttribute("content");

			const meta_title = (
				doc.querySelector("meta[name='title']") ??
				doc.querySelector("meta[property='og:title']") ??
				doc.querySelector("meta[name='twitter:title']")
			)?.getAttribute("content");

			const meta_description = (
				doc.querySelector("meta[name='description']") ??
				doc.querySelector("meta[property='og:description']") ??
				doc.querySelector("meta[name='twitter:description']")
			)?.getAttribute("content");

			const meta_image = (
				doc.querySelector("meta[property='og:image']") ?? doc.querySelector("meta[property='twitter:image']")
			)?.getAttribute("content");

			return { title, description, meta_title, meta_description, meta_image };
		} catch (error) {
			console.error("Error fetching meta for", url, error instanceof Error ? error.message : "Unknown error");
		}
	}

	return { title: null, description: null, meta_title: null, meta_description: null, meta_image: null };
}

export function generateMeta(meta: Meta, fallback_root: string) {
	const m = (name: string, content?: string | null, fallback?: string | null) => {
		content = content ?? fallback;
		// standard tags and twitter use "name"
		return content ? meta_tag({ name, content }) : null;
	};

	const mp = (property: string, content?: string | null, fallback?: string | null) => {
		content = content ?? fallback;
		// @ts-expect-error "property" is not a valid prop, but og uses it
		return content ? meta_tag({ property, content }) : null;
	};

	const card = "summary_large_image";

	const title = meta.title ?? meta.meta_title ?? "Link Preview";
	const description = meta.description ?? meta.meta_description ?? "This link was shortened using Blink ✨";

	const img = meta.meta_image ?? `${fallback_root}/assets/img/1200x630.jpg`;

	return [
		m("title", title),
		m("description", description),
		mp("og:type", "website"),
		mp("og:title", meta.meta_title, title),
		mp("og:description", meta.meta_description, description),
		mp("og:image", img),
		m("twitter:card", card),
		m("twitter:title", meta.meta_title, title),
		m("twitter:description", meta.meta_description, description),
		m("twitter:image", img),
	].filter(Boolean);
}
