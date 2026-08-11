import type { PartOfSpeech } from "../../vocabulary/data/part_of_speech";
import type { PhraseType } from "../data/phrase_type";

/** LexicalEvidenceStore: the Proposed learning phase's `w_ij` --
 * persistent evidence for one observed (phraseType, fromState ->
 * toState) transition, feeding `ScoringFactors.lexicalEvidenceSum`
 * (`role/sequence_engine.ts`'s own `pathLexicalEvidence`), never a
 * second scoring tensor or a replacement for `ReadingScorer` (spec 15).
 *
 * Ported from linguistics/documentation/sentence_reading_state_machine_specification.md's
 * "Learned Lexical Transition Evidence" sections (15-24) -- those
 * sections are `[Proposed]`, not `[Built]`, in the Python
 * specification (no Python implementation exists to port field-for-
 * field); this is a first, deliberately scoped implementation of that
 * same design: positive-only evidence (spec 18's decay/reduction is
 * explicitly "a learning-policy concern", left for a later phase),
 * incremented only for a transition inside a phrase from a
 * SENTENCE-level `ValidationOutcome.VALID` reading (spec 17: "Only
 * validated observations may reinforce lexical evidence" --
 * `LinguisticController.recordObservedReading`'s own gate), one
 * process-lifetime in-memory Map (no cross-session persistence -- the
 * "storage representation may be tensor-backed" spec 16 allows for is
 * a separate, larger concern than what this UI needs to demonstrate the
 * mechanism working). `fromState: undefined` means "phrase start" --
 * the same convention `SequenceEngine.getAllowedNextStates` already
 * uses for "not yet started". */
export class LexicalEvidenceStore {
  private readonly evidence = new Map<string, number>();

  private static key(phraseType: PhraseType, fromState: PartOfSpeech | undefined, toState: PartOfSpeech): string {
    return `${phraseType}|${fromState ?? "START"}|${toState}`;
  }

  /** Reinforces one observed transition -- spec 17's "Validated
   * observation => lexical evidence increases". Repetition changes
   * preference among candidates that remain admissible under
   * deterministic grammar; it can never make an already-INVALID
   * reading outrank a VALID one (spec 15 -- `ReadingScorer.rankKey`
   * ranks `validation` ahead of `lexicalEvidenceSum`). */
  record(phraseType: PhraseType, fromState: PartOfSpeech | undefined, toState: PartOfSpeech): void {
    const key = LexicalEvidenceStore.key(phraseType, fromState, toState);
    this.evidence.set(key, (this.evidence.get(key) ?? 0) + 1);
  }

  /** spec 15's `w_ij` -- observed lexical support for one transition.
   * `0` for a transition never observed, the same "absence of positive
   * evidence" spec 16 asks to keep distinguishable from confirmed
   * negative evidence (there is no negative evidence in this scoped
   * phase -- see this class's own docstring). */
  weightFor(phraseType: PhraseType, fromState: PartOfSpeech | undefined, toState: PartOfSpeech): number {
    return this.evidence.get(LexicalEvidenceStore.key(phraseType, fromState, toState)) ?? 0;
  }

  /** Total observations recorded across every distinct transition --
   * the Sentence Reader UI's own "Learning: N observations" indicator
   * reads this, so it shows genuine accumulated state, not a fabricated
   * counter. */
  get totalObservations(): number {
    let total = 0;
    for (const count of this.evidence.values()) total += count;
    return total;
  }

  get distinctTransitionCount(): number {
    return this.evidence.size;
  }
}
