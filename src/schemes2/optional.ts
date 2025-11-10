import {type BaseSchema, kType} from "./base.js";
import {isSecret} from "./secret.js";

export type SchemaType<S> = S extends BaseSchema<infer T> ? T : never
export type OptionalSchema<S extends BaseSchema<unknown>> = BaseSchema<SchemaType<S> | undefined> & {
  type: 'optional'
  inner: S
}

export function optional<S extends BaseSchema<unknown>>(schema: S): OptionalSchema<S> {
  return {
    type: 'optional',
    inner: schema,
    schema: schema.schema,
    [kType]: '' as unknown as (SchemaType<S> | undefined),
    aliases: []
  }
}

export function hasOptionalSchemaInChain(schema: BaseSchema<unknown>): boolean {
  if (isSecret(schema)) {
    return hasOptionalSchemaInChain(schema.inner)
  }

  return isOptional(schema)
}

export function isOptional(schema: BaseSchema<unknown>): schema is OptionalSchema<BaseSchema<unknown>> {
  return 'type' in schema && schema.type === 'optional'
}