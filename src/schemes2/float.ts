import {type BaseSchema, kType} from "./base.js";
import type {Alias} from "../schemes/base.js";

export type FloatSchema<T> = BaseSchema<T> & {
  type: 'float'
  coerce: (value: unknown) => unknown
}

export type FloatOpts = {
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

export function float(opts: FloatOpts = {}): FloatSchema<number> {
  const { aliases = [], min, max } = opts

  if (min !== undefined && max !== undefined && min > max) {
    throw new Error(`min must be <= max, got min ${min} and max ${max}`)
  }

  return {
    jsonSchema: {
      type: 'number',
      minimum: min,
      maximum: max,
    },
    [kType]: 0 as number,
    aliases,
    type: 'float',
    coerce
  }
}