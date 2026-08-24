import type { Aside } from "./aside";
import type { Footer } from "./footer";
import type { Header } from "./header";
import type { Main } from "./main";
import type { Navigation } from "./navigation";

/** HTML5 <body>: structural container for rendered document content. */
export interface Body {
  header?: Header;
  navigation: readonly Navigation[];
  main?: Main;
  asides: readonly Aside[];
  footer?: Footer;
}

export function createBody(init: Partial<Body> = {}): Body {
  return { navigation: [], asides: [], ...init };
}
