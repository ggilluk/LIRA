import type { FieldSet } from "./field_set";
import type { Input } from "./input";
import type { Label } from "./label";
import type { Selection } from "./selection";
import type { TextArea } from "./text_area";

/** HTML5 <form>. */
export interface Form {
  fieldSets: readonly FieldSet[];
  controls: readonly (Input | TextArea | Selection)[];
  labels: readonly Label[];
}
