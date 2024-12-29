import { div, h2, p, section } from "@hyperactive/hyper/elements";
import { State } from "@hyperactive/hyper";

export const Hero = (completed: State<number>, total: State<number>) => {
	return section(
		{ class: "todohero_section" },
		div(h2("Tasks done"), p("Keep it up")),
		div(
			p(
				completed.transform(v => String(v)),
				"/",
				total.transform(v => String(v)),
			),
		),
	);
};
