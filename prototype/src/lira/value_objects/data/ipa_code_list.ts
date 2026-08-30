import type { Code } from "./code";
import { PronounciationCode } from "./code/pronounciationCode";
import { PronounciationCategoryCode } from "./code/pronounciationCategoryCode";

/** Official International Phonetic Alphabet code-list metadata and entries.
 *
 * `listAgencyId` uses UN/CEFACT UNCL 3055 value `ZZZ` because the
 * International Phonetic Association does not have a dedicated 3055 code;
 * `listAgencyName` therefore carries the responsible agency name.
 */
export const IPA_CODE_LIST = {
  listId: "IPA",
  listName: "International Phonetic Alphabet",
  listAgencyId: "ZZZ",
  listAgencyName: "International Phonetic Association",
} as const;

/** One member of the International Phonetic Alphabet code list. */
export interface IPACode extends Code {
  value: PronounciationCode;
  ipaNumber?: string;
  category: PronounciationCategoryCode;
  unicodeCodePoints: string[];
  unicodeNames: string[];
}

/** Builds an IPA code-list member with the fixed code-list metadata. */
export function ipaCode(
  value: PronounciationCode,
  category: PronounciationCategoryCode,
  unicodeCodePoints: string[],
  unicodeNames: string[],
  extra: Omit<IPACode, "value" | "category" | "unicodeCodePoints" | "unicodeNames" | "listId" | "listAgencyId" | "listAgencyName" | "listName"> = {},
): IPACode {
  return {
    value,
    category,
    unicodeCodePoints,
    unicodeNames,
    ...IPA_CODE_LIST,
    ...extra,
  };
}
