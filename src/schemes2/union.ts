import {type BaseSchema, kType} from "./base.js";
import type {Alias} from "../schemes/base.js";

export type UnionSchema<S extends BaseSchema<unknown>> = BaseSchema<S[typeof kType]> & {
  type: 'union'
  schemes: S[]
}

function coerce(this: UnionSchema<BaseSchema<unknown>>, value: unknown): unknown {
  for (const schema of this.schemes) {
    const coercedValue = schema.coerce?.(value)

    if (value !== undefined && coercedValue !== value) {
      return coercedValue
    }
  }

  return value
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
    jsonSchema: {
      type: 'object',
      oneOf: schemes.map(s => s.jsonSchema)
    },
    aliases,
    coerce
  }
}