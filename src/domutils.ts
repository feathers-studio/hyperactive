import { SimpleState } from "./state.ts";

export const bindInput =
	<State extends SimpleState>(state: State) =>
	(el: HTMLElement) =>
		el.addEventListener("input", e =>
			state.publish((e?.target as unknown as { value: string }).value),
		);
