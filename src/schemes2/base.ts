import type {JSONSchema} from "json-schema-to-typescript";
import type {Alias} from "../schemes/base.js";
import type {StringSchemaBuilder} from "./string.js";

export const kType = Symbol('kType')

export interface BaseSchema<T> {
  [kType]: T
  schema: JSONSchema
  aliases: Alias[]
}
