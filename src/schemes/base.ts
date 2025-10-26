import type {Visitor} from "../visitor/visitor.js";
import type {JSONSchema} from "json-schema-to-typescript";
import {isObject, type ObjectSchema, type ObjectSpec} from "./object.js";

export const kType = Symbol("type")
export type BaseSchema<T> = {
  /**
   * A property holding the schema underlying type.
   */
  [kType]: T

  /**
   * A coercion function.
   * No coercion is done if undefined.
   *
   * @param value
   */
  coerce?: (value: unknown) => unknown

  /**
   * A list of alias from which the current schema can be loaded.
   */
  aliases: Alias[]

  /**
   * True if the current schema is optional.
   */
  optional: boolean

  accept<R>(visitor: Visitor<R>): R

  /**
   * The JSON schema that validates this schema.
   * This JSON schema validates the configuration as returned by the sources.
   */
  schema: JSONSchema

  /**
   * The JSON that validates this schema after all the refs are resolved.
   */
  afterRefSchema?: JSONSchema

  /**
   * True if the current schema is a secret.
   */
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