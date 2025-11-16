import {type BaseSchema, kType} from "./base.js";

export type ClearSchema<S extends BaseSchema<unknown>> = BaseSchema<S[typeof kType]> & {
  type: 'clear'
  inner: S
}

function coerce(this: ClearSchema<BaseSchema<unknown>>, value: unknown): unknown {
  return this.inner.coerce?.(value) ?? value
}

/**
 * Mark a value as clear text.
 * By default, all the values are considered clear text.
 *
 * @param schema
 */
export function clear<S extends BaseSchema<unknown>>(schema: S): ClearSchema<S> {
  return {
    type: 'clear',
    inner: schema,
    [kType]: '' as unknown as S[typeof kType],
    aliases: [],
    schema: schema.schema,
    coerce
  }
}