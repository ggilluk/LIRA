/** HTML5 <meta>: machine-readable document metadata. Metadata does not
 * automatically enter Linguistics; a value explicitly classified as Text
 * is materialised separately as a LinguisticUnit by the ingestion role. */
export interface Metadata {
  name?: string;
  property?: string;
  content?: string;
}

export function createMetadata(init: Metadata): Metadata {
  return { ...init };
}
