import { guessEnv } from "./guessEnv.ts";
import { createBrowserHistory, createMemoryHistory } from "./vendor/browser.ts";
export { type Location } from "./vendor/browser.ts";
export const history = guessEnv() === "browser" ? createBrowserHistory() : createMemoryHistory();
