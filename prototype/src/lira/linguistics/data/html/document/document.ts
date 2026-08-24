import type { Body } from "./body";
import type { Head } from "./head";

/** HTML5 document root. Document structure is preserved before any contained Text is passed to LinguisticUnit. */
export interface Document {
  head: Head;
  body: Body;
}

export function createDocument(init: Pick<Document, "head" | "body">): Document {
  return { ...init };
}
