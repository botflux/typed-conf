import type {Alias} from "../schemes/base.js";
import {type BaseSchema, kType, type Mapping} from "./base.js";

export interface StringSchema<T, U> extends BaseSchema<T, U> {
  type: 'string'
}

export type StringOpts<From> = {
  minLength?: number
  maxLength?: number
  aliases?: Alias[]
  mapping?: Mapping<string, From>
}

function coerce(value: unknown): unknown {
  return value
}

export function string<U>(opts: StringOpts<U> = {}): StringSchema<string, U> {
  const { aliases = [], minLength, maxLength, mapping } = opts

  return {
    [kType]: '' as unknown as string,
    type: 'string',
    beforeRefSchema: {
      type: 'string',
      ...minLength !== undefined && { minLength },
      ...maxLength !== undefined && { maxLength },
    },
    aliases,
    coerce,
    ...mapping !== undefined && { mapping }
  }
}