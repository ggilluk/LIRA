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
