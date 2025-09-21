import type {ObjectSchema, ObjectSpec} from "../schemes.js";
import type {LoadedConfig} from "../sources/source.js";

export interface Validator {
  validate(schema: ObjectSchema<ObjectSpec>, object: unknown): unknown

  validate2(schema: ObjectSchema<ObjectSpec>, object: LoadedConfig): LoadedConfig
}