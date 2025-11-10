import {type BaseSchema, type BaseSchemaBuilder, kType} from "./base.js";

/**
 * Mark an underlying schema as secret.
 *
 * @param schema
 */
export function secret<S extends BaseSchema<unknown>>(schema: S) {
  return {
    type: 'secret',
    inner: schema,
    [kType]: '' as unknown as S[typeof kType]
  }
}