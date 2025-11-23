import type {JSONSchema} from "json-schema-to-typescript";
import type {Alias} from "../schemes/base.js";

export const kType = Symbol('kType')

export type Mapping<T, U> = {
  map: (value: U) => T
  baseSchema: BaseSchema<U>
}

export interface BaseSchema<T, U = unknown> {
  [kType]: T
  beforeRefSchema: JSONSchema
  afterRefSchema?: JSONSchema
  aliases: Alias[]
  coerce?: (value: unknown) => unknown
  mapping?: Mapping<T, U>
}
