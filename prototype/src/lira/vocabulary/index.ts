/** Vocabulary Layer: term/lexeme-level concept identity within a Domain
 * (surface-form to concept resolution). Contains lexical inventory
 * only (Rule 17).
 *
 * Ported from vocabulary/__init__.py -- see that file's own docstring
 * for the full layer description, and prototype/README.md for what
 * this browser port deliberately does and doesn't carry over. */
export { VocabularyAgent } from "./agents";
export { AsyncDictionaryHydrator } from "./role/dictionary_hydrator";
export { DictionaryProcessor } from "./role/dictionary_processor";
export { ExternalDictionaryAdapter } from "./role/external_dictionary_adapter";
export { LexicalRelationshipProcessor } from "./role/lexical_relationship_processor";
export { PartOfSpeechIdentifier } from "./role/part_of_speech_identifier";
export { RelationshipSeeder } from "./role/relationship_seeder";
export { WordSeeder } from "./role/word_seeder";

export type { AttributeValue } from "./data/attribute_value";
export { type DefinitionWordReference, isResolved } from "./data/definition_word_reference";
export { Dictionary } from "./data/dictionary";
export { EditorialLabel } from "./data/editorial_label";
export { type ExternalWordCandidate, combinedConfidence } from "./data/external_word_candidate";
export { VocabularyLayer } from "./data/layer";
export type { LexicalRelationship } from "./data/lexical_relationship";
export { LexicalRelationshipStore } from "./data/lexical_relationship_store";
export { LexicalRelationshipSystemPropertyTensor } from "./data/lexical_relationship_tensor";
export { LexicalRelationshipType, relationshipCategory, relationshipGroup, relationshipItem } from "./data/lexical_relationship_type";
export { PartOfSpeech } from "./data/part_of_speech";
export type { Pronunciation } from "./data/pronunciation";
export { RegisterCode } from "./data/register_code";
export type { SourceReference } from "./data/source_reference";
export { SystemPropertiesRef } from "./data/system_properties_ref";
export {
  type Word,
  type WordInit,
  createWord,
  copyWordWithFreshUuid,
  lemmaForms,
  inflections,
  morphologicalVariants,
  derivedForms,
  synonyms,
  antonyms,
  hypernyms,
  hyponyms,
  meronyms,
  holonyms,
  troponyms,
  spellingVariants,
  abbreviations,
  acronyms,
  contractions,
  transliterations,
  relatedWordsOf,
  definitionWords,
} from "./data/word";
export { IdentificationSource, type WordIdentification } from "./data/word_identification";
export { type WordLookupContext, createWordLookupContext } from "./data/word_lookup_context";
export { DictionaryView } from "./ui/dictionary_view";
