import type {ObjectSchema, ObjectSpec} from "../schemes/object.js";
import type {JSONSchema} from "json-schema-to-typescript";

export interface Validator {
  validate(schema: ObjectSchema<ObjectSpec>, object: unknown): unknown
}

export interface SchemaValidator {
  validate(schema: JSONSchema, toValidate: unknown, name: string): void
}