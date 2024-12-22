import { config } from "./config";
import { db } from "./setup";
import type { User, Session, Link, Visit } from "./types";

export const queries = {
	users: {
		getByUsername: (username: string) =>
			db.query<User, { username: string }>(`SELECT * FROM users WHERE username = :username`).get({ username }),
		getById: (id: number) => db.query<User, { id: number }>(`SELECT * FROM users WHERE id = :id`).get({ id }),
		create: (user: Omit<User, "id" | "created_at" | "updated_at">) =>
			db
				.query<User, Omit<User, "id" | "created_at" | "updated_at">>(
					`INSERT INTO users (username, password) VALUES (:username, :password) RETURNING *`,
				)
				.get(user),
		list: () => db.query<User, []>(`SELECT * FROM users`).all(),
		update: (user: Pick<User, "username" | "password">) =>
			db
				.query<User, Pick<User, "username" | "password">>(
					`UPDATE users SET username = :username, password = :password WHERE username = :username`,
				)
				.run(user),
	},
	sessions: {
		create: (session: Omit<Session, "id" | "logged_out_at" | "created_at" | "updated_at">) =>
			db
				.query<Session, Omit<Session, "id" | "logged_out_at" | "created_at" | "updated_at">>(
					`INSERT INTO sessions (token, user_id, ip_address, user_agent, expires_at)
						VALUES (:token, :user_id, :ip_address, :user_agent, :expires_at) RETURNING *`,
				)
				.get(session),
		access: (token: string) =>
			db
				.query<Session, { token: string }>(
					`UPDATE sessions
						SET last_active_at = CURRENT_TIMESTAMP, expires_at = datetime('now', '+30 days')
						WHERE token = :token AND logged_out_at IS NULL AND expires_at > CURRENT_TIMESTAMP
						RETURNING *`,
				)
				.get({ token }),
		logout: (token: string) =>
			db
				.query<Session, { token: string }>(`UPDATE sessions SET logged_out_at = CURRENT_TIMESTAMP WHERE token = :token`)
				.run({ token }),
	},
	links: {
		get: (slug: string) => db.query<Link, { slug: string }>(`SELECT * FROM links WHERE slug = :slug`).get({ slug }),
		create: (link: Omit<Link, "id" | "created_at" | "updated_at">) =>
			db
				.query<Link, Omit<Link, "id" | "created_at" | "updated_at">>(
					`INSERT INTO links (title, description, meta_title, meta_description, meta_image, target, slug, user_id)
						VALUES (:title, :description, :meta_title, :meta_description, :meta_image, :target, :slug, :user_id)
						RETURNING *`,
				)
				.get(link),
		list: ({ user_id, page = 1, limit = 10 }: { user_id: number; page: number; limit: number }) =>
			db
				.query<Link & { visits: number }, { user_id: number; offset: number; limit: number }>(
					`SELECT links.*, 
						(SELECT COUNT(*) FROM visits WHERE visits.link_id = links.id) AS visits
						FROM links
						WHERE links.user_id = :user_id
						ORDER BY links.created_at DESC
						LIMIT :limit
						OFFSET :offset`,
				)
				.all({ user_id, offset: (page - 1) * limit, limit }),
	},
	visits: {
		create: (visit: Omit<Visit, "id" | "created_at" | "updated_at">) =>
			db
				.query<Visit, Omit<Visit, "id" | "created_at" | "updated_at">>(
					`INSERT INTO visits (link_id, ip_address, user_agent)
						VALUES (:link_id, :ip_address, :user_agent) RETURNING *`,
				)
				.get(visit),
	},
};

{
	for (const user of config.users) {
		const existing = queries.users.getByUsername(user.username);
		if (!existing) {
			console.log(`Creating user ${user.username}`);
			queries.users.create({ username: user.username, password: await Bun.password.hash(user.password) });
		} else if (!(await Bun.password.verify(user.password, existing.password))) {
			console.log(`Updating password for user ${user.username}`);
			queries.users.update({ username: user.username, password: await Bun.password.hash(user.password) });
		}
	}
}

const users = queries.users.list();
console.log(users.length, "users in the database:", users.map(user => user.username).join(", "));
