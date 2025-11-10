import {type BaseSchema, kType} from "./base.js";
import type {Alias} from "../schemes/base.js";

export type BooleanSchema<T> = BaseSchema<T> & {
  type: 'boolean'
}

export type BooleanOpts = {
  aliases?: Alias[]
}

export function boolean(opts: BooleanOpts = {}): BooleanSchema<boolean> {
  const { aliases = [] } = opts

  return {
    type: 'boolean',
    schema: {
      type: 'boolean'
    },
    aliases,
    [kType]: true
  }
}