import type { Link } from "../reference/link";
import type { Metadata } from "../metadata/metadata";
import type { Title } from "../metadata/title";

/** HTML5 <head>: document metadata. */
export interface Head {
  title?: Title;
  metadata: readonly Metadata[];
  links: readonly Link[];
}

export function createHead(init: Partial<Head> = {}): Head {
  return { metadata: [], links: [], ...init };
}
