/** Particle: Word's own PARTICLE-specific subtype. The Word Form to
 * Part of Speech Matrix (data/word_form_part_of_speech_matrix.md) ticks
 * only Base Lemma Canonical Form for this part of speech -- already
 * Word.baseLemmaCanonicalForm's own field, shared by every subtype --
 * so this class carries no field of its own beyond that; it exists
 * purely so a caller can narrow a Word to "definitely a particle" at
 * the type level, the same as its siblings. */

import { PartOfSpeech } from "./enums/part_of_speech";
import { createWord, type Word } from "./word";

export interface Particle extends Word {
  partOfSpeech: PartOfSpeech.PARTICLE;
}

export type ParticleInit = Pick<Particle, "text"> & Partial<Omit<Particle, "text" | "partOfSpeech">>;

export function createParticle(init: ParticleInit): Particle {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.PARTICLE }) as Particle;
}

export function isParticle(word: Word): word is Particle {
  return word.partOfSpeech === PartOfSpeech.PARTICLE;
}
