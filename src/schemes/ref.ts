import {type BaseSchema, kType} from "./base.js";
import type {Alias} from "../alias.js";
import {String} from "typebox";

export type RefSchema<T> = BaseSchema<T> & {
  type: 'ref'
  sourceName: string
  refToSourceParams: (ref: string) => Record<string, unknown>
  refSchema: BaseSchema<T>
}

function coerce(value: unknown): unknown {
  return value
}

export type RefOpts<S extends BaseSchema<unknown>> = {
  schema: S
  sourceName: string
  refToSourceParams: (ref: string) => Record<string, unknown>
  aliases?: Alias[]
  deprecated?: boolean
}

export function ref<S extends BaseSchema<unknown>>(opts: RefOpts<S>): RefSchema<S[typeof kType]> {
  const { aliases = [], refToSourceParams, sourceName, schema, deprecated = false } = opts

  return {
    [kType]: schema[kType] as unknown as S[typeof kType],
    type: 'ref',
    sourceName,
    jsonSchema: {
      type: 'string',
      ...deprecated && { deprecated: true }
    },
    aliases,
    refSchema: schema,
    refToSourceParams,
    coerce,
    deprecated,
    validationSchema: String(),
  }
}

export function isRef(schema: BaseSchema<unknown>): schema is RefSchema<unknown> {
  return 'type' in schema && schema.type === 'ref'
}