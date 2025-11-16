import type {Alias} from "../schemes/base.js";
import {type BaseSchema, kType} from "./base.js";

export interface StringSchema<T> extends BaseSchema<T> {
  type: 'string'
}

export type StringOpts = {
  minLength?: number
  maxLength?: number
  aliases?: Alias[]
}

function coerce(value: unknown): unknown {
  return value
}

export function string(opts: StringOpts = {}): StringSchema<string> {
  const { aliases = [], minLength, maxLength } = opts

  return {
    [kType]: '' as unknown as string,
    type: 'string',
    schema: {
      type: 'string',
      minLength,
      maxLength,
    },
    aliases,
    coerce
  }
}