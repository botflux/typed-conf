import type {BaseSchema} from "./base.js";
import type {AnySourceType, Source} from "../sources/interfaces.js";

export function clearText<Schema extends BaseSchema<unknown, Source<AnySourceType>>>(schema: Schema): Schema {
  return schema
}