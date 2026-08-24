import type { Input } from "./input";
import type { Legend } from "./legend";
import type { Selection } from "./selection";
import type { TextArea } from "./text_area";

export interface FieldSet {
  legend?: Legend;
  controls: readonly (Input | TextArea | Selection)[];
}
