"""Isolated structural utility to cleanly decompose a token stream into sub-clauses."""

from typing import List

from .grammar_configurator import GrammarConfigurator

# Word (lira.vocabulary) used only as a type hint here -- see clause.py
# for why it's left unimported. Punctuation is a Word
# (part_of_speech=PUNCTUATION), not a separate type.


class ClauseSegmentationUtility:
    @staticmethod
    def slice_tokens_into_clauses(
        tokens: List["Word"],
        config: GrammarConfigurator
    ) -> List[List["Word"]]:

        clause_buckets: List[List["Word"]] = [[]]

        for token in tokens:
            token_text = token.text.lower()

            # Match against injected grammar configurations instead of structural literals
            is_delimiter = token_text in config.clause_delimiters
            is_conjunction = token_text in config.coordinating_conjunctions

            if is_delimiter or (is_conjunction and clause_buckets[-1]):
                if is_delimiter:
                    clause_buckets[-1].append(token)
                clause_buckets.append([])
                if not is_delimiter:
                    clause_buckets[-1].append(token)
            else:
                clause_buckets[-1].append(token)

        return [b for b in clause_buckets if b]

    @staticmethod
    def candidate_clause_boundaries(tokens: List["TokenReading"], config: GrammarConfigurator) -> List[int]:
        """Candidate split points (token indices) a Phase 2 recursive
        ClauseReader would confirm or reject via clause-level sequencing
        -- unlike slice_tokens_into_clauses above (the write path's own
        eager, unconditional split), this only *proposes* boundaries at
        each clause_delimiters/coordinating_conjunctions token and never
        splits anything itself. Phase 1's ClauseReader treats its whole
        given span as one ClauseType.INDEPENDENT clause (plan: "one
        independent clause per sentence, non-recursive" in this phase)
        and does not act on these boundaries yet -- see
        linguistics/documentation/README.md, Not Yet Built."""
        boundaries = []
        for index, token in enumerate(tokens):
            text = token.text.lower()
            if text in config.clause_delimiters or text in config.coordinating_conjunctions:
                boundaries.append(index)
        return boundaries
