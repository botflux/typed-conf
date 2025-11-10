import {type BaseSchema, kType} from "./base.js";
import type {Alias} from "../schemes/base.js";

export type FloatSchema<T> = BaseSchema<T> & {
  type: 'float'
}

export type FloatOpts = {
  min?: number
  max?: number
  aliases?: Alias[]
}

export function float(opts: FloatOpts = {}): FloatSchema<number> {
  const { aliases = [], min, max } = opts

  if (min !== undefined && max !== undefined && min > max) {
    throw new Error(`min must be <= max, got min ${min} and max ${max}`)
  }

  return {
    schema: {
      type: 'number',
      minimum: min,
      maximum: max,
    },
    [kType]: 0 as number,
    aliases,
    type: 'float',
  }
}