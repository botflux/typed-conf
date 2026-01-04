import {type BaseSchema, kType} from "./base.js";
import {isSecret} from "./secret.js";
import {Optional} from "typebox";

export type SchemaType<S> = S extends BaseSchema<infer T> ? T : never

export type OptionalSchema<S extends BaseSchema<unknown>> = BaseSchema<SchemaType<S> | undefined> & {
  type: 'optional'
  inner: S
}

function coerce(this: OptionalSchema<BaseSchema<unknown>>, value: unknown): unknown {
  if (value === undefined) {
    return undefined
  }

  return this.inner.coerce?.(value)
}

export function optional<S extends BaseSchema<unknown>>(schema: S): OptionalSchema<S> {
  return {
    type: 'optional',
    inner: schema,
    jsonSchema: schema.jsonSchema,
    [kType]: '' as unknown as (SchemaType<S> | undefined),
    aliases: [],
    coerce,
    ...schema.validationSchema !== undefined && {
      validationSchema: Optional(schema.validationSchema)
    }
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