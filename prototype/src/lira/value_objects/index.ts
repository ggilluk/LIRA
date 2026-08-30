/** Value Objects Layer: parses and normalises primitive values (measures,
 * quantities, codes, identifiers, dates) into typed value object
 * instances before they enter the Knowledge Layer. Contains typed
 * unqualified data only (Rule 19).
 *
 * Ported from value_objects/__init__.py, scoped to the four CCTS types
 * the Vocabulary Layer port actually needs (Code, Identifier, Number,
 * Text) plus the Layer/Agent markers -- the rest of the CCTS Core
 * Component Type catalogue (Amount, BinaryObject, DateTime, Graphic,
 * Indicator, Measure, Percent, Picture, Quantity, Rate, Sound, Video)
 * is not ported yet; add it here when a layer that needs it is ported. */
export { ValueObjectAgent } from "./agents";
export { ValueObjectsLayer } from "./data/layer";
export { type Code, code } from "./data/code";
export { PronounciationCode } from "./data/code/pronounciationCode";
export { PronounciationCategoryCode } from "./data/code/pronounciationCategoryCode";
export {
  IPA_CODE_LIST,
  type IPACode,
  ipaCode,
} from "./data/ipa_code_list";
export { type Identifier, identifier } from "./data/identifier";
export { type Number_, number } from "./data/number";
export { type Text, text } from "./data/text";
