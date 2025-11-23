import {type BaseSchema, kType} from "./base.js";
import type {Alias} from "../schemes/base.js";

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
}

export function ref<S extends BaseSchema<unknown>>(opts: RefOpts<S>): RefSchema<S[typeof kType]> {
  const { aliases = [], refToSourceParams, sourceName, schema } = opts

  return {
    [kType]: schema[kType] as unknown as S[typeof kType],
    type: 'ref',
    sourceName,
    jsonSchema: {
      type: 'string'
    },
    aliases,
    refSchema: schema,
    refToSourceParams,
    coerce
  }
}