export const redirect = (url: string, headers: Record<string, string> = {}) =>
	new Response(null, {
		status: 302,
		headers: {
			"Set-Cookie": `token=; Max-Age=0; HttpOnly; Secure; SameSite=Strict`,
			"Location": url,
			...headers,
		},
	});
