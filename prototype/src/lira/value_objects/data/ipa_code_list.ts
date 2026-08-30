import type { Code } from "./code";

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

/** Major sections of the official IPA chart. */
export enum IPACategory {
  CONSONANT_PULMONIC = 0,
  CONSONANT_NON_PULMONIC = 1,
  OTHER_SYMBOL = 2,
  VOWEL = 3,
  DIACRITIC = 4,
  SUPRASEGMENTAL = 5,
  TONE_AND_WORD_ACCENT = 6,
}

/** One member of the International Phonetic Alphabet code list.
 *
 * `value` is the IPA symbol itself. `ipaNumber`, where the Association
 * assigns one, preserves the official IPA number rather than replacing it
 * with a LIRA-local identifier.
 */
export interface IPACode extends Code {
  value: string;
  ipaNumber?: string;
  category: IPACategory;
  unicodeCodePoints: string[];
  unicodeNames: string[];
}

/** Builds an IPA code-list member with the fixed code-list metadata. */
export function ipaCode(
  value: string,
  category: IPACategory,
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
