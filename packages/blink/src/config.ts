export interface ConfigUser {
	username: string;
	password: string;
}

export interface Config {
	port: number;
	database: string;
	users: ConfigUser[];
}

let config: Config = {
	port: 3000,
	database: "blink.db",
	users: [],
};

try {
	config = Object.assign(config, (await Bun.file("config.json").json()) as Partial<Config>);
} catch {
	console.log("Config not found, using defaults. Create a config to be able to login.");
}

export { config };
