import type {ObjectSchema, ObjectSpec} from "../schemes.js";
import type {ConfigWithMetadata} from "../sources/source.js";

export interface Validator {
  validate(schema: ObjectSchema<ObjectSpec>, object: unknown, metadata?: ConfigWithMetadata): unknown
}