import {type BaseSchema, kType} from "./base.js";
import type {Alias} from "../schemes/base.js";

export type UnionSchema<S extends BaseSchema<unknown>> = BaseSchema<S[typeof kType]> & {
  type: 'union'
  schemes: S[]
}
export type UnionOpts = {
  aliases?: Alias[];
}

export function union<S extends BaseSchema<unknown>>(schemes: S[], opts: UnionOpts = {}): UnionSchema<S> {
  const {aliases = []} = opts;

  return {
    type: 'union',
    schemes,
    [kType]: '' as unknown as S[typeof kType],
    schema: {
      type: 'object',
      oneOf: schemes.map(s => s.schema)
    },
    aliases
  }
}