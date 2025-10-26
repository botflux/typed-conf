import type {Visitor} from "../visitor/visitor.js";
import type {JSONSchema} from "json-schema-to-typescript";
import {isObject, type ObjectSchema, type ObjectSpec} from "./object.js";

export const kType = Symbol("type")
export type BaseSchema<T> = {
  [kType]: T
  coerce?: (value: unknown) => unknown
  aliases: Alias[]
  optional: boolean
  accept<R>(visitor: Visitor<R>): R
  schema: JSONSchema
  secret: boolean
}

export interface BaseSchemaBuilder<S extends BaseSchema<unknown>> {
  schema: S

  optional(): this
  aliases(...aliases: Alias[]): this
  secret(): this
}

export type Alias = { id: string, sourceKey: string }
export type Entry = {
  key: string[]
  value: BaseSchema<unknown>
}

export function flatten(config: ObjectSchema<ObjectSpec>, base: string[] = []): Entry[] {
  const entries = Object.entries(config.spec)

  return entries.flatMap(([k, value]) => isObject(value.schema)
    ? flatten(value.schema, [...base, k])
    : {key: [...base, k], value: value.schema} as Entry)
}

export type Static<T extends BaseSchemaBuilder<BaseSchema<unknown>>> = T["schema"][typeof kType]