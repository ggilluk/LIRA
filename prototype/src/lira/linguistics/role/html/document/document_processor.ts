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
 * │ Module Name     │ lira/linguistics/role/html/document/document_processor
 * │ Filename        │ document_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-24
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Reads, parses and writes Document (an HTML5 document root) for
 * │                 │ HTMLProcessor.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/html/document/document_processor
 * @file document_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Document } from "../../../data/html/document/document";
import { readElement } from "../processor_support";
import { parseBody, writeBody } from "./body_processor";
import { parseHead, writeHead } from "./head_processor";
export function readDocument(root: ParentNode): Element | undefined { return readElement(root, "html"); }
export function parseDocument(element: Element): Document {
  const head = element.querySelector(":scope > head"); const body = element.querySelector(":scope > body");
  if (!head || !body) throw new Error("HTML document requires <head> and <body>.");
  return { head: parseHead(head), body: parseBody(body) };
}
export function writeDocument(value: Document): string {
  return `<!doctype html><html>${writeHead(value.head)}${writeBody(value.body)}</html>`;
}
