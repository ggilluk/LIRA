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
 * │ Module Name     │ lira/value_objects/index
 * │ Filename        │ index.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-11-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Value Objects Layer public API: parses and normalises primitive
 * │                 │ values into CCTS-aligned value objects.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/index
 * @file index.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/** Value Objects Layer: parses and normalises primitive values. */
export { ValueObjectAgent } from "./agents";
export { ValueObjectsLayer } from "./data/layer";
export { type BinaryObject, binaryObject } from "./data/binary_object";
export { type Code, code } from "./data/code";
export { PronounciationCode } from "./data/code/pronounciationCode";
export { PronounciationCategoryCode } from "./data/code/pronounciationCategoryCode";
export { LanguageCode } from "./data/code/languageCode";
export { DialectCode } from "./data/code/dialectCode";
export { ScriptCode } from "./data/code/scriptCode";
export { LanguageStyleCode } from "./data/code/languageStyleCode";
export { MimeCode } from "./data/code/mimeCode";
export { PronounciationCodelist } from "./data/enum/pronounciationCodelist";
export { PronounciationCategoryCodelist } from "./data/enum/pronounciationCategoryCodelist";
export { LanguageCodelist, languageCodelistFromCode } from "./data/enum/languageCodelist";
export { DialectCodelist, dialectCodelistFromCode } from "./data/enum/dialectCodelist";
export { ScriptCodelist, scriptCodelistFromCode } from "./data/enum/scriptCodelist";
export { LanguageStyleCodelist } from "./data/enum/languageStyleCodelist";
export { MIME_CODELIST_VERSION, MimeCodelist, mimeCodelistFromCode } from "./data/enum/mimeCodelist";
export { type Identifier, identifier, randomGraphUuid } from "./data/identifier";
export { type Measure, measure } from "./data/measure";
export { type Number_, number } from "./data/number";
export {
  type Text,
  text,
  textToLowerCase,
  textToUpperCase,
  languageCodeFor,
  dialectCodeFor,
  scriptCodeFor,
  languageStyleCodeFor,
} from "./data/text";
export { Uri } from "./data/uri";
