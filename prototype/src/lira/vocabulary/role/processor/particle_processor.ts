import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Word } from "../../data/entities/word";
import { createWord } from "../word_processor";
import type { Particle } from "../../data/entities/particle";

export type ParticleInit = Pick<Particle, "text"> & Partial<Omit<Particle, "text" | "partOfSpeech">>;

export function createParticle(init: ParticleInit): Particle {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.PARTICLE }) as Particle;
}

export function isParticle(word: Word): word is Particle {
  return word.partOfSpeech === PartOfSpeech.PARTICLE;
}
