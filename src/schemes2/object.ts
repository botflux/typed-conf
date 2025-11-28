import type {Alias} from "../schemes/base.js";
import {type BaseSchema, kType} from "./base.js";
import {hasOptionalSchemaInChain} from "./optional.js";

export function isObject(schema: BaseSchema<unknown>): schema is ObjectSchema<Record<string, BaseSchema<unknown>>> {
  return 'type' in schema && schema.type === 'object'
}

export type ObjectSchemaToType<P extends Record<string, BaseSchema<unknown>>> = {
  [K in keyof P]: P[K][typeof kType]
}

export type ObjectSchema<P extends Record<string, BaseSchema<unknown>>> = BaseSchema<ObjectSchemaToType<P>> & {
  type: 'object',
  props: P,
  metadata: Record<string | symbol, unknown>
}

export type ObjectOpts<Metadata extends Record<string | symbol, unknown>> = {
  aliases?: Alias[]
  metadata?: Metadata
  additionalProperties?: boolean
}

export function object<P extends Record<string, BaseSchema<unknown>>, Metadata extends Record<string | symbol, unknown>>(props: P, opts: ObjectOpts<Metadata> = {}): ObjectSchema<P> {
  const { aliases = [], metadata = {}, additionalProperties = false } = opts

  const required = Object.entries(props)
    .filter(([, schema]) => !hasOptionalSchemaInChain(schema))
    .map(([key]) => key)

  const beforeRefJsonSchemaProps = Object.fromEntries(Object.entries(props).map(([key, value]) => [key, value.jsonSchema]))

  return {
    type: 'object',
    props,
    aliases,
    jsonSchema: {
      type: 'object',
      properties: beforeRefJsonSchemaProps,
      required,
      additionalProperties,
    },
    [kType]: '' as ObjectSchemaToType<P>,
    metadata,
  }
}