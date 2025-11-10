import {type BaseSchema, kType} from "./base.js";
import type {Alias} from "../schemes/base.js";

export type IntegerSchema<T> = BaseSchema<T> & {
  type: 'integer'
}

export type IntegerOpts = {
  min?: number
  max?: number
  aliases?: Alias[]
}

export function integer(opts: IntegerOpts = {}): IntegerSchema<number> {
  const { aliases = [], min, max } = opts

  if (min !== undefined && max !== undefined && min > max) {
    throw new Error(`min must be <= max, got min ${min} and max ${max}`)
  }

  return {
    type: 'integer',
    [kType]: 0,
    aliases,
    schema: {
      type: 'integer',
      minimum: min,
      maximum: max,
    },
  }
}