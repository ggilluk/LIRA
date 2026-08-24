import type { Head } from "../../../data/html/document/head";
import { readElement } from "../processor_support";
import { parseMetadata, writeMetadata } from "../metadata/metadata_processor";
import { parseTitle, writeTitle } from "../metadata/title_processor";
import { parseLink, writeLink } from "../reference/link_processor";
export function readHead(root: ParentNode): Element | undefined { return readElement(root, "head"); }
export function parseHead(element: Element): Head {
  const title = element.querySelector(":scope > title");
  return { title: title ? parseTitle(title) : undefined, metadata: Array.from(element.querySelectorAll(":scope > meta")).map(parseMetadata), links: Array.from(element.querySelectorAll(":scope > link")).map(parseLink) };
}
export function writeHead(value: Head): string {
  return `<head>${value.title ? writeTitle(value.title) : ""}${value.metadata.map(writeMetadata).join("")}${value.links.map(writeLink).join("")}</head>`;
}
