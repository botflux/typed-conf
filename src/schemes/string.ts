import {type BaseSchema, kType, type Mapping} from "./base.js";
import type {Alias} from "../alias.js";
import {String} from "typebox";

export interface StringSchema<T, U> extends BaseSchema<T, U> {
  type: 'string'
}

export type StringOpts<From> = {
  minLength?: number
  maxLength?: number
  aliases?: Alias[]
  mapping?: Mapping<string, From>
  defaultValue?: string,
  deprecated?: boolean
}

function coerce(value: unknown): unknown {
  return value
}

export function string<U>(opts: StringOpts<U> = {}): StringSchema<string, U> {
  const { aliases = [], minLength, maxLength, mapping, defaultValue, deprecated = false } = opts

  return {
    [kType]: '' as unknown as string,
    type: 'string',
    jsonSchema: {
      type: 'string',
      ...minLength !== undefined && { minLength },
      ...maxLength !== undefined && { maxLength },
      ...deprecated && { deprecated: true }
    },
    aliases,
    coerce,
    ...mapping !== undefined && { mapping },
    ...defaultValue !== undefined && { defaultValue },
    deprecated,
    validationSchema: String({
      ...minLength !== undefined && { minLength },
      ...maxLength !== undefined && { maxLength },
    })
  }
}