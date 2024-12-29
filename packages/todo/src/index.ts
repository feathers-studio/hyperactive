import { renderDOM } from "@hyperactive/hyper";
import type { Document } from "@hyperactive/hyper/dom";
import { Home } from "./app/page.ts";

declare const document: Document;

renderDOM(document.getElementById("app")!, Home());
