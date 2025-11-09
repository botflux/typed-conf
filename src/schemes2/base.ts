import type {JSONSchema} from "json-schema-to-typescript";
import type {Alias} from "../schemes/base.js";
import type {StringSchemaBuilder} from "./string.js";

export const kType = Symbol('kType')

export interface BaseSchema<T> {
  [kType]: T
  schema: JSONSchema
  optional: boolean
  aliases: Alias[]
  secret: boolean
}

export interface BaseSchemaBuilder<S extends BaseSchema<unknown>> {
  plain: S
  secret(): BaseSchemaBuilder<S>
  optional(): BaseSchemaBuilder<S extends BaseSchema<infer T> ? BaseSchema<T | undefined> : never>
}