import type { Link } from "./link";
import type { Metadata } from "./metadata";
import type { Title } from "./title";

/** HTML5 <head>: document metadata. It is structural and does not itself
 * create a LinguisticUnit; any contained Text-bearing entity does. */
export interface Head {
  title?: Title;
  metadata: readonly Metadata[];
  links: readonly Link[];
}

export function createHead(init: Partial<Head> = {}): Head {
  return { metadata: [], links: [], ...init };
}
