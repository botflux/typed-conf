import {type BaseSchema, type BaseSchemaBuilder, kType} from "./base.js";

export type SchemaType<S> = S extends BaseSchema<infer T> ? T : never
export type OptionalSchema<S extends BaseSchema<unknown>> = BaseSchema<SchemaType<S> | undefined> & {
  type: 'optional'
  inner: BaseSchemaBuilder<S>
}

export function optional<S extends BaseSchema<unknown>>(schema: BaseSchemaBuilder<S>): OptionalSchema<S> {
  return {
    type: 'optional',
    optional: true,
    inner: schema,
    schema: schema.plain.schema,
    [kType]: '' as unknown as (SchemaType<S> | undefined),
    secret: false,
    aliases: []
  }
}