import type {ObjectSchema, ObjectSpec} from "../schemes.js";

export interface Validator {
  validate(schema: ObjectSchema<ObjectSpec>, object: unknown): unknown
}