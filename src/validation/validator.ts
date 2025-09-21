import type {ObjectSchema, ObjectSpec} from "../schemes/object.js";

export interface Validator {
  validate(schema: ObjectSchema<ObjectSpec>, object: unknown): unknown
}