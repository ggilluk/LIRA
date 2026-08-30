import type { LanguageCode } from "./code/languageCode";
import type { DialectCode } from "./code/dialectCode";
import type { ScriptCode } from "./code/scriptCode";

/** Text. Type, per the UN/CEFACT Core Components Technical Specification.
 *
 * `languageCode` specialises the CCTS language identifier using ISO 639-1.
 * `dialectCode` is LIRA's language-variety specialisation using IANA BCP 47
 * variant subtags because UN/CEFACT does not publish a separate dialect list.
 * `scriptCode` uses ISO 15924. Each specialised Code retains the external
 * standards code as CCTS Code. Content and a numeric Codelist identity for
 * later tensor/graph operations.
 */
export interface Text {
  value: string;
  languageCode?: LanguageCode;
  scriptCode?: ScriptCode;
  dialectCode?: DialectCode;
  version?: string;
  formats?: readonly string[];
}

export function text(value: string, extra: Omit<Text, "value"> = {}): Text {
  return { value, ...extra };
}
