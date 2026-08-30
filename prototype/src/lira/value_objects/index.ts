/** Value Objects Layer: parses and normalises primitive values. */
export { ValueObjectAgent } from "./agents";
export { ValueObjectsLayer } from "./data/layer";
export { type Code, code } from "./data/code";
export { PronounciationCode } from "./data/code/pronounciationCode";
export { PronounciationCategoryCode } from "./data/code/pronounciationCategoryCode";
export { LanguageCode } from "./data/code/languageCode";
export { DialectCode } from "./data/code/dialectCode";
export { ScriptCode } from "./data/code/scriptCode";
export { PronounciationCodelist } from "./data/enum/pronounciationCodelist";
export { PronounciationCategoryCodelist } from "./data/enum/pronounciationCategoryCodelist";
export { LanguageCodelist, languageCodelistFromCode } from "./data/enum/languageCodelist";
export { DialectCodelist, dialectCodelistFromCode } from "./data/enum/dialectCodelist";
export { ScriptCodelist, scriptCodelistFromCode } from "./data/enum/scriptCodelist";
export { type Identifier, identifier } from "./data/identifier";
export { type Number_, number } from "./data/number";
export { type Text, text, textToLowerCase, textToUpperCase } from "./data/text";
