/** HTML5 <link>. */
export interface Link {
  relationship: string;
  url: string;
  mediaType?: string;
}

export function createLink(init: Link): Link {
  return { ...init };
}
