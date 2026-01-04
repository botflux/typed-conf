import {type BaseSchema, kType} from "./base.js";
import type {Alias} from "../alias.js";
import {Boolean} from "typebox";

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
  deprecated?: boolean
}

export function boolean(opts: BooleanOpts = {}): BooleanSchema<boolean> {
  const { aliases = [], deprecated = false } = opts

  return {
    type: 'boolean',
    jsonSchema: {
      type: 'boolean',
      ...deprecated && { deprecated: true }
    },
    aliases,
    [kType]: true,
    coerce,
    deprecated,
    validationSchema: Boolean()
  }
}