/** HTML5 <meta>: machine-readable document metadata. */
export interface Metadata {
  name?: string;
  property?: string;
  content?: string;
}

export function createMetadata(init: Metadata): Metadata {
  return { ...init };
}
