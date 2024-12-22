export const redirectClear = (url: string, headers: Record<string, string> = {}) =>
	redirect(url, { "Set-Cookie": `token=; Max-Age=0; HttpOnly; Secure; SameSite=Strict`, ...headers });

export const redirect = (url: string, headers: Record<string, string> = {}) =>
	new Response(null, { status: 302, headers: { Location: url, ...headers } });
