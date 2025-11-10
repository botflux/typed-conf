import {type BaseSchema, kType} from "./base.js";

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