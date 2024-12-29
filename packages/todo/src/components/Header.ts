import { ListState, trust } from "@hyperactive/hyper";
import { h1, header, svg } from "@hyperactive/hyper/elements";

export function Header() {
	return new ListState([svg(trust("<path d='")), h1("TODO")]);
}
