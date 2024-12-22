export type User = {
	id: number;
	username: string;
	password: string;
	created_at: string;
	updated_at: string;
};

export type Session = {
	id: number;
	token: string;
	user_id: number;
	ip_address: string | null;
	user_agent: string | null;
	expires_at: string;
	logged_out_at: string | null;
	created_at: string;
	updated_at: string;
};

export type Link = {
	id: number;
	user_id: number;
	slug: string;
	target: string;
	title?: string;
	created_at: string;
	updated_at: string;
};

export type Visit = {
	id: number;
	link_id: number;
	ip_address?: string | null;
	user_agent?: string | null;
	created_at: string;
};
