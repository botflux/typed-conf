import {type BaseSchema, kType} from "./base.js";

export type SecretSchema<T> = BaseSchema<T> & {
  type: 'secret'
  inner: BaseSchema<T>
}

function coerce(this: SecretSchema<BaseSchema<unknown>>, value: unknown): unknown {
  return this.inner.coerce?.(value) ?? value
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
    jsonSchema: schema.jsonSchema,
    aliases: [],
    coerce,
    validationSchema: schema.validationSchema
  }
}

export function isSecret(schema: BaseSchema<unknown>): schema is SecretSchema<unknown> {
  return 'type' in schema && schema.type === 'secret'
}