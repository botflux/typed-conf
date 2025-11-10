import {type BaseSchema, kType} from "./base.js";

/**
 * Mark a value as clear text.
 * By default, all the values are considered clear text.
 *
 * @param schema
 */
export function clear<S extends BaseSchema<unknown>>(schema: S) {
  return {
    type: 'clear',
    inner: schema,
    [kType]: '' as unknown as S[typeof kType],
  }
}