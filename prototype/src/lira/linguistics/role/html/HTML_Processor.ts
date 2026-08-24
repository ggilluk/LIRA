import { createBody } from "../../data/html/document/body";
import { createDocument, type Document as HtmlDocument } from "../../data/html/document/document";
import { createHead } from "../../data/html/document/head";
import { createMain } from "../../data/html/document/main";
import { createMetadata } from "../../data/html/metadata/metadata";
import { createTitle } from "../../data/html/metadata/title";
import { createLink } from "../../data/html/reference/link";

/**
 * HTMLProcessor is the Linguistics-Layer boundary between an HTML5 page and
 * LIRA's HTML-aligned data model (data/html/).
 *
 * The processor has three deliberately separate responsibilities:
 *
 *   readPage()  -> obtains the source HTML for one page.
 *   parsePage() -> recognises HTML5 structure and converts it into LIRA data.
 *   writePage() -> converts LIRA HTML data back into an HTML5 document string.
 *
 * The HTML element itself supplies document context (Document, Main, Article,
 * Section, Paragraph, Table, Figure, ...). Any value classified as natural-
 * language Text is then passed into the existing Linguistics read path as a
 * LinguisticUnit; URLs, identifiers, media and other typed values remain typed
 * data and are not treated as language merely because HTML represents them as
 * strings.
 *
 * This file owns behaviour only. HTML5 data entities remain under
 * linguistics/data/html/ and the existing Linguistics data files are not
 * modified or duplicated here.
 */
export class HTMLProcessor {
  /**
   * Reads one web page and returns its HTML source unchanged.
   *
   * Network acquisition is intentionally separate from parsePage(): callers
   * can parse HTML obtained from fetch(), a file, a test fixture, browser DOM,
   * cache or any future LIRA ingestion source without changing the parser.
   *
   * Throws when the HTTP response is not successful. Redirect handling,
   * credentials and request headers can be controlled through `requestInit`.
   */
  async readPage(url: string | URL, requestInit?: RequestInit): Promise<string> {
    const response = await fetch(url, requestInit);
    if (!response.ok) {
      throw new Error(`Unable to read HTML page '${String(url)}': HTTP ${response.status} ${response.statusText}`);
    }
    return response.text();
  }

  /**
   * Parses HTML source into the LIRA HTML5-aligned Document data structure.
   *
   * Phase 1 establishes the page boundary and machine-readable <head> data:
   * <title>, <meta> and <link>, plus the existence of <main>. The recursive
   * element parsers for Article/Section/Paragraph/List/Table/Figure/Form then
   * extend this same method without changing its public contract.
   *
   * The key ingestion invariant is:
   *
   *   HTML value -> classify value type -> Text -> LinguisticUnit
   *
   * DOM attributes such as href/src/id/class are therefore not automatically
   * linguistic input. Text-bearing element content and explicitly textual
   * attributes (for example img.alt) are the values that enter Linguistics.
   */
  parsePage(html: string): HtmlDocument {
    if (typeof DOMParser === "undefined") {
      throw new Error("HTMLProcessor.parsePage requires a DOMParser-capable runtime.");
    }

    const source = new DOMParser().parseFromString(html, "text/html");

    const titleText = source.querySelector("head > title")?.textContent?.trim();
    const title = titleText ? createTitle({ text: titleText }) : undefined;

    const metadata = Array.from(source.querySelectorAll("head > meta")).map((element) =>
      createMetadata({
        name: element.getAttribute("name") ?? undefined,
        property: element.getAttribute("property") ?? undefined,
        content: element.getAttribute("content") ?? undefined,
      }),
    );

    const links = Array.from(source.querySelectorAll("head > link[href]")).map((element) =>
      createLink({
        relationship: element.getAttribute("rel") ?? "",
        url: element.getAttribute("href") ?? "",
        mediaType: element.getAttribute("type") ?? undefined,
      }),
    );

    const head = createHead({ title, metadata, links });

    // Body recognition begins structurally. Child-specific processors are kept
    // separate so adding Article/Section/etc. never changes the page contract.
    const main = source.querySelector("body > main, main") ? createMain() : undefined;
    const body = createBody({ main });

    return createDocument({ head, body });
  }

  /**
   * Writes a LIRA HTML5 Document back to a standards-shaped HTML page.
   *
   * This is deliberately the inverse boundary of parsePage(), not a renderer
   * for LIRA's UI. It serialises document data; it does not perform linguistic
   * reasoning. Text already held by a LinguisticUnit is emitted as escaped
   * character data while typed URL/metadata values become HTML attributes.
   *
   * As additional data/html entities gain parse helpers, their matching write
   * helpers should be added here in the same one-to-one fashion so round-trip
   * behaviour remains explicit and testable.
   */
  writePage(document: HtmlDocument): string {
    const headParts: string[] = [];

    if (document.head.title?.text) {
      headParts.push(`<title>${escapeHtml(document.head.title.text)}</title>`);
    }

    for (const metadata of document.head.metadata) {
      const attributes: string[] = [];
      if (metadata.name !== undefined) attributes.push(`name="${escapeAttribute(metadata.name)}"`);
      if (metadata.property !== undefined) attributes.push(`property="${escapeAttribute(metadata.property)}"`);
      if (metadata.content !== undefined) attributes.push(`content="${escapeAttribute(metadata.content)}"`);
      headParts.push(`<meta ${attributes.join(" ")}>`);
    }

    for (const link of document.head.links) {
      const attributes = [
        `rel="${escapeAttribute(link.relationship)}"`,
        `href="${escapeAttribute(link.url)}"`,
      ];
      if (link.mediaType !== undefined) attributes.push(`type="${escapeAttribute(link.mediaType)}"`);
      headParts.push(`<link ${attributes.join(" ")}>`);
    }

    // At this stage Body owns structural presence. Element-specific writers
    // will populate the corresponding HTML5 structures as those data entities
    // are connected to the processor.
    const bodyParts: string[] = [];
    if (document.body.main !== undefined) bodyParts.push("<main></main>");

    return `<!doctype html>\n<html>\n<head>\n${headParts.join("\n")}\n</head>\n<body>\n${bodyParts.join("\n")}\n</body>\n</html>`;
  }
}

/** Escapes character data written between HTML tags. */
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** Escapes a value written inside a double-quoted HTML attribute. */
function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;");
}
