import type { Article } from "./article";
import type { Section } from "./section";

/** HTML5 <main>: the document's primary content region. */
export interface Main {
  articles: readonly Article[];
  sections: readonly Section[];
}

export function createMain(init: Partial<Main> = {}): Main {
  return { articles: [], sections: [], ...init };
}
