import {type BaseSchema, kType} from "./base.js";
import type {Alias} from "../schemes/base.js";

export type BooleanSchema<T> = BaseSchema<T> & {
  type: 'boolean'
  coerce: (value: unknown) => unknown
}

function coerce(value: unknown): unknown {
  if (typeof value !== "string") {
    return value
  }

  if (value === "true") {
    return true
  }

  if (value === "false") {
    return false
  }

  return value
}

export type BooleanOpts = {
  aliases?: Alias[]
}

export function boolean(opts: BooleanOpts = {}): BooleanSchema<boolean> {
  const { aliases = [] } = opts

  return {
    type: 'boolean',
    jsonSchema: {
      type: 'boolean'
    },
    aliases,
    [kType]: true,
    coerce,
  }
}