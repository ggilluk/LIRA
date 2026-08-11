import type { Word } from "../../vocabulary/data/word";
import type { TokenReading } from "../data/token_reading";
import type { GrammarConfigurator } from "./grammar_configurator";

/** Isolated structural utility to cleanly decompose a token stream into
 * sub-clauses.
 *
 * Ported from linguistics/role/clause_segmentation.py. */
export class ClauseSegmentationUtility {
  static sliceTokensIntoClauses(tokens: readonly Word[], config: GrammarConfigurator): Word[][] {
    const clauseBuckets: Word[][] = [[]];

    for (const token of tokens) {
      const tokenText = token.text.toLowerCase();

      // Match against injected grammar configurations instead of
      // structural literals.
      const isDelimiter = config.clauseDelimiters.has(tokenText);
      const isConjunction = config.coordinatingConjunctions.has(tokenText);

      if (isDelimiter || (isConjunction && clauseBuckets[clauseBuckets.length - 1].length > 0)) {
        if (isDelimiter) clauseBuckets[clauseBuckets.length - 1].push(token);
        clauseBuckets.push([]);
        if (!isDelimiter) clauseBuckets[clauseBuckets.length - 1].push(token);
      } else {
        clauseBuckets[clauseBuckets.length - 1].push(token);
      }
    }

    return clauseBuckets.filter((bucket) => bucket.length > 0);
  }

  /** Candidate split points (token indices) a Phase 2 recursive
   * ClauseReader would confirm or reject via clause-level sequencing --
   * unlike sliceTokensIntoClauses above (the write path's own eager,
   * unconditional split), this only *proposes* boundaries at each
   * clauseDelimiters/coordinatingConjunctions token and never splits
   * anything itself. Phase 1's ClauseReader treats its whole given span
   * as one ClauseType.INDEPENDENT clause and does not act on these
   * boundaries yet. */
  static candidateClauseBoundaries(tokens: readonly TokenReading[], config: GrammarConfigurator): number[] {
    const boundaries: number[] = [];
    tokens.forEach((token, index) => {
      const text = token.text.toLowerCase();
      if (config.clauseDelimiters.has(text) || config.coordinatingConjunctions.has(text)) {
        boundaries.push(index);
      }
    });
    return boundaries;
  }
}
