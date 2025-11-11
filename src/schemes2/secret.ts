import {type BaseSchema, kType} from "./base.js";

export type SecretSchema<T> = BaseSchema<T> & {
  type: 'secret'
  inner: BaseSchema<T>
}

/**
 * Mark an underlying schema as secret.
 *
 * @param schema
 */
export function secret<S extends BaseSchema<unknown>>(schema: S): SecretSchema<S[typeof kType]> {
  return {
    type: 'secret',
    inner: schema,
    [kType]: '' as unknown as S[typeof kType],
    schema: schema.schema,
    aliases: [],
  }
}

export function isSecret(schema: BaseSchema<unknown>): schema is SecretSchema<unknown> {
  return 'type' in schema && schema.type === 'secret'
}