import { Database } from "bun:sqlite";
import { config } from "./config";

export const db = new Database(config.database, { strict: true });

db.exec("PRAGMA journal_mode = WAL;");

const migrations = [
	{
		up: () => {
			// Create tables

			db.exec(
				`CREATE TABLE IF NOT EXISTS users (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					username TEXT UNIQUE NOT NULL,
					password TEXT NOT NULL,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
				)`,
			);

			db.exec(
				`CREATE TABLE IF NOT EXISTS sessions (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					token TEXT UNIQUE,
					username TEXT NOT NULL,
					ip_address TEXT,
					user_agent TEXT NOT NULL,
					expires_at DATETIME NOT NULL,
					last_active_at DATETIME,
					logged_out_at DATETIME,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
				)`,
			);

			db.exec(
				`CREATE TABLE IF NOT EXISTS links (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					user_id INTEGER NOT NULL,
					slug TEXT UNIQUE NOT NULL,
					target TEXT,
					title TEXT,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
				)`,
			);

			db.exec(
				`CREATE TABLE IF NOT EXISTS visits (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					link_id INTEGER NOT NULL,
					ip_address TEXT,
					user_agent TEXT,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE ON UPDATE CASCADE
				)`,
			);

			// Create triggers

			for (const table of ["users", "sessions", "links", "db_meta"]) {
				db.exec(`DROP TRIGGER IF EXISTS update_${table}_updated_at`);
				db.exec(
					`CREATE TRIGGER IF NOT EXISTS update_${table}_updated_at
					AFTER UPDATE ON ${table}
					BEGIN
						UPDATE ${table} SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
					END;`,
				);
			}
		},
		down: () => {
			db.exec("DROP TABLE IF EXISTS users");
			db.exec("DROP TABLE IF EXISTS sessions");
			db.exec("DROP TABLE IF EXISTS links");
			db.exec("DROP TABLE IF EXISTS visits");
			db.exec("DROP TABLE IF EXISTS db_meta");
		},
	},
	{
		up: () => {
			db.exec("UPDATE db_meta SET value = '2' WHERE key = 'version'");
		},
		down: () => {
			db.exec("UPDATE db_meta SET value = '1' WHERE key = 'version'");
		},
	},
];

db.exec(
	`CREATE TABLE IF NOT EXISTS db_meta (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		key TEXT UNIQUE NOT NULL,
		value TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`,
);

const currentVersion = Number(
	db //
		.query<{ value: string }, { key: string }>("SELECT value FROM db_meta WHERE key = :key")
		.get({ key: "version" })?.value ?? 0,
);

if (currentVersion === 0) {
	console.log("Database is empty, applying migrations...");
} else {
	console.log(
		`Current database version: ${currentVersion}. ` +
			(currentVersion < migrations.length ? "Applying migrations to reach version." : "No migrations to apply."),
	);
}

for (let index = 1; index <= migrations.length; index++) {
	const migration = migrations[index - 1];
	if (currentVersion < index) {
		try {
			db.transaction(() => {
				migration.up();
				db.exec(
					`INSERT INTO db_meta (key, value)
						VALUES ('version', ?)
						ON CONFLICT(key) DO UPDATE SET
							value = excluded.value,
							updated_at = CURRENT_TIMESTAMP
					`,
					[index.toString()],
				);
			})();
			console.log(`Migration to version ${index} applied successfully.`);
		} catch (error) {
			console.error(`Failed to apply migration to version ${index}:`, error);
			break;
		}
	}
}
