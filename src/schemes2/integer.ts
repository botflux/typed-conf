import {type BaseSchema, kType} from "./base.js";
import type {Alias} from "../schemes/base.js";

export type IntegerSchema<T> = BaseSchema<T> & {
  type: 'integer'
  coerce(value: unknown): unknown
}

export type IntegerOpts = {
  min?: number
  max?: number
  aliases?: Alias[]
}

function coerce(value: unknown): unknown {
  if (typeof value !== "string") {
    return value
  }

  const parsed = Number.parseFloat(value)

  if (Number.isNaN(parsed)) {
    return value
  }

  return parsed
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
    beforeRefSchema: {
      type: 'integer',
      ...min !== undefined && {
        minimum: min,
      },
      ...max !== undefined && {
        maximum: max,
      }
    },
    coerce
  }
}