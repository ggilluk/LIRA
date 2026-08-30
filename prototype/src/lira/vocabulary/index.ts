/** Vocabulary Layer: term/lexeme-level concept identity within a Domain
 * (surface-form to concept resolution). Contains lexical inventory
 * only (Rule 17).
 *
 * Ported from vocabulary/__init__.py -- see that file's own docstring
 * for the full layer description, and prototype/README.md for what
 * this browser port deliberately does and doesn't carry over. */
export { VocabularyAgent } from "./agents";
export { AsyncDictionaryHydrator } from "./role/dictionary_hydrator";
export { AuxiliarySeeder } from "./role/auxiliary_seeder";
export { DeterminerSeeder } from "./role/determiner_seeder";
export { DictionaryProcessor } from "./role/dictionary_processor";
export { ExternalDictionaryAdapter } from "./role/external_dictionary_adapter";
export { IdentificationSource, type WordIdentifier } from "./role/word_identifier";
export { MorphologicalPointerRelationshipProcessor } from "./role/morphological_pointer_relationship_processor";
export { NounCharacterFormSeeder, NOUN_CHARACTER_FORMS } from "./role/noun_character_form_seeder";
export { SemanticRelationshipProcessor } from "./role/semantic_relationship_processor";
export { PartOfSpeechIdentifier } from "./role/part_of_speech_identifier";
export { RelationshipSeeder } from "./role/relationship_seeder";
export { WordSeeder } from "./role/word_seeder";
export { type WordInit, createWord, copyWordWithFreshUuid, definitionWords } from "./role/word_processor";
export { loadWordNetSynsets, type WordNetSynset } from "./role/wordnet_loader";

export type { AttributeValue } from "./data/attribute_value";
export { type DefinitionWordReference, isResolved } from "./data/definition_word_reference";
export { Dictionary } from "./data/dictionary";
export { EditorialLabel } from "./data/enums/editorial_label";
export { type ExternalWordCandidate, combinedConfidence } from "./data/external_word_candidate";
export { HolonymRootWord } from "./data/enums/holonym_root_word";
export { HypernymRootWord } from "./data/enums/hypernym_root_word";
export { InterrogativeRootWord } from "./data/enums/interrogative_root_word";
export { VocabularyContext } from "./data/vocabulary_context";
export type { WordForm } from "./data/entities/word_form";
export { createWordForm } from "./role/word_form_processor";
export { WordForms } from "./data/word_forms";
export { WordFormField } from "./data/enums/word_forms_enum";
export type { MorphologicalPointerRelationship } from "./data/morphological_pointer_relationship";
export { MorphologicalPointerRelationshipStore } from "./data/morphological_pointer_relationship_store";
export { MorphologicalPointerRelationshipSystemPropertyTensor } from "./data/morphological_pointer_relationship_tensor";
export type { LexicalRelationship } from "./data/lexical_relationship";
export { LexicalRelationshipStore } from "./data/lexical_relationship_store";
export { LexicalRelationshipProcessor } from "./role/lexical_relationship_processor";
export { LexicalRelationshipType, relationshipCategory, relationshipGroup, relationshipItem } from "./data/enums/lexical_relationship_type";
export { PartOfSpeech } from "./data/enums/part_of_speech";
export type { SemanticRelationship } from "./data/semantic_relationship";
export { SemanticRelationshipStore } from "./data/semantic_relationship_store";
export { SemanticRelationshipSystemPropertyTensor } from "./data/semantic_relationship_tensor";
export { SemanticRelationshipKind, SEMANTIC_MERONYM_KIND_QUALIFIER, type SemanticMeronymKind } from "./data/enums/semantic_relationship_kind";
export { RegisterCode } from "./data/enums/register_code";
export type { SourceReference } from "./data/source_reference";
export { SystemPropertiesRef } from "./data/system_properties_ref";
export { VectorPrimitiveRootWord } from "./data/enums/vector_primitive_root_word";
export type { Word } from "./data/entities/word";
export { type WordLookupContext, createWordLookupContext } from "./data/word_lookup_context";
export { DictionaryView } from "./ui/server/dictionary_controller";
