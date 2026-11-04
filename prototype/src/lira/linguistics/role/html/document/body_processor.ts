/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/linguistics/role/html/document/body_processor
 * │ Filename        │ body_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Body (HTML5 <body>) for HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/document/body_processor
 * @file body_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
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
