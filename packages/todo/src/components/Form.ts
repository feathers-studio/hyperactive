import { trust } from "@hyperactive/hyper";
import { button, form, input, label, span, svg } from "@hyperactive/hyper/elements";

export function Form() {
	const handleSubmit = (event: any) => {
		event.preventDefault();
		// reset the form
		event.target.reset();
	};
	return form(
		{
			class: "form",
			on: { submit: handleSubmit },
		},
		label(
			input({
				type: "text",
				name: "todo",
				id: "todo",
				placeholder: "Write your next task",
			}),
		),
		button(
			span({ class: "visually-hidden" }, "Submit"),

			svg(
				// @ts-expect-error SVG attributes are not typed correctly?
				{ xmlns: "http://www.w3.org/2000/svg", width: "32", height: "32", fill: "#000000", viewBox: "0 0 256 256" },
				trust(
					`<path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>`,
				),
			),

			trust(`
				<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path></svg>
			`),
		),
	);
}
