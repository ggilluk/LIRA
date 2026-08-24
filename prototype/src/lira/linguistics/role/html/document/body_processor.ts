import type { Body } from "../../../data/html/document/body";
import { readElement } from "../processor_support";
import { parseAside, writeAside } from "./aside_processor";
import { parseFooter, writeFooter } from "./footer_processor";
import { parseHeader, writeHeader } from "./header_processor";
import { parseMain, writeMain } from "./main_processor";
import { parseNavigation, writeNavigation } from "./navigation_processor";
export function readBody(root: ParentNode): Element | undefined { return readElement(root, "body"); }
export function parseBody(element: Element): Body {
  const header = element.querySelector(":scope > header"); const main = element.querySelector(":scope > main"); const footer = element.querySelector(":scope > footer");
  return {
    header: header ? parseHeader(header) : undefined,
    navigation: Array.from(element.querySelectorAll(":scope > nav")).map(parseNavigation),
    main: main ? parseMain(main) : undefined,
    asides: Array.from(element.querySelectorAll(":scope > aside")).map(parseAside),
    footer: footer ? parseFooter(footer) : undefined,
  };
}
export function writeBody(value: Body): string {
  return `<body>${value.header ? writeHeader(value.header) : ""}${value.navigation.map(writeNavigation).join("")}${value.main ? writeMain(value.main) : ""}${value.asides.map(writeAside).join("")}${value.footer ? writeFooter(value.footer) : ""}</body>`;
}
