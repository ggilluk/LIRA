/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/vocabulary/data/entities/word_coordination
 * │ Filename        │ word_coordination.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-25
 * │ Modified Date   │ 2026-08-25
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ WordCoordination: coordination whose coordinates are Words, the
 * │                 │ generic fallback for word classes without their own type.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/entities/word_coordination
 * @file word_coordination.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Word } from "./word";
import type { Coordination } from "./coordination";

/**
 * Represents coordination whose coordinates are Words.
 *
 * Example:
 * "car or van"
 *
 * The deliberate generic fallback for every word class that doesn't
 * get its own narrowed specialisation below (Noun/Verb/Adjective/
 * Adverb only) -- Pronoun ("he and she"), Preposition ("to and from"),
 * Determiner, Auxiliary, Numeral, Interjection, and Conjunction itself
 * all coordinate through this type rather than a same-shaped
 * PronounCoordination/PrepositionCoordination/... of their own. Not an
 * oversight: those four are the classes worth narrowing because
 * downstream code that already knows it's holding, say, a Noun
 * coordination can stay typed as Noun throughout; the rest are
 * uncommon enough to coordinate on their own, or specific enough in
 * their own right, that a bare WordCoordination is the honest type
 * until a real caller needs otherwise.
 */
export interface WordCoordination extends Coordination<Word> {}
