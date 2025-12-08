import {type BaseSchema, kType} from "./base.js";
import {hasOptionalSchemaInChain} from "./optional.js";
import type {Alias} from "../alias.js";
import type {Prettify} from "../types.js";

export function isObject(schema: BaseSchema<unknown>): schema is ObjectSchema<Record<string, BaseSchema<unknown>>, boolean> {
  return 'type' in schema && schema.type === 'object'
}

export type ObjectSchemaToType<P extends Record<string, BaseSchema<unknown>>> = {
  [K in keyof P]: P[K][typeof kType]
}

export type AdditionalPropertiesType<AdditionalProperties extends boolean> = AdditionalProperties extends true ? Record<string, unknown> : {}
export type ObjectSchema<P extends Record<string, BaseSchema<unknown>>, AdditionalProperties extends boolean> =
  BaseSchema<Prettify<ObjectSchemaToType<P> & AdditionalPropertiesType<AdditionalProperties>>>
  & {
  type: 'object',
  props: P,
  metadata: Record<string | symbol, unknown>
}

export type ObjectOpts<Metadata extends Record<string | symbol, unknown>, AdditionalProperties extends boolean> = {
  aliases?: Alias[]
  metadata?: Metadata
  additionalProperties?: AdditionalProperties
}

export function object<
  P extends Record<string, BaseSchema<unknown>>,
  Metadata extends Record<string | symbol, unknown>,
  AdditionalProperties extends boolean = false
>(props: P, opts: ObjectOpts<Metadata, AdditionalProperties> = {}): ObjectSchema<P, AdditionalProperties> {
  const {aliases = [], metadata = {}, additionalProperties = false} = opts

  const defaultEntries = Object.entries(props)
      .filter(([key, schema]) => schema.defaultValue !== undefined)
      .map(([ key, schema ]) => [ key, schema.defaultValue ])

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
    [kType]: '' as unknown as (ObjectSchemaToType<P> & AdditionalPropertiesType<AdditionalProperties>),
    metadata,
    ...defaultEntries.length > 0 && { defaultValue: Object.fromEntries(defaultEntries) }
  }
}