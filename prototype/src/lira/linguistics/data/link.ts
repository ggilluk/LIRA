/** HTML5 <link>: a typed relationship to an external resource. It carries
 * no visible Text and therefore does not itself create a LinguisticUnit. */
export interface Link {
  relationship: string;
  url: string;
  mediaType?: string;
}

export function createLink(init: Link): Link {
  return { ...init };
}
