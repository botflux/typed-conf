import type { Alias } from "../schemes/base.js";
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
}

export type ObjectOpts = {
  aliases?: Alias[]
}

export function object<P extends Record<string, BaseSchema<unknown>>>(props: P, opts: ObjectOpts = {}): ObjectSchema<P> {
  const { aliases = [] } = opts

  const required = Object.entries(props)
    .filter(([, schema]) => !hasOptionalSchemaInChain(schema))
    .map(([key]) => key)

  const beforeRefJsonSchemaProps = Object.fromEntries(Object.entries(props).map(([key, value]) => [key, value.beforeRefSchema]))
  const afterRefJsonSchemaProps = Object.fromEntries(Object.entries(props).map(([key, value]) => [key, value.afterRefSchema ?? value.beforeRefSchema]))

  return {
    type: 'object',
    props,
    aliases,
    beforeRefSchema: {
      type: 'object',
      properties: beforeRefJsonSchemaProps,
      required,
      additionalProperties: false,
    },
    afterRefSchema: {
      type: 'object',
      properties: afterRefJsonSchemaProps,
      required,
      additionalProperties: false,
    },
    [kType]: '' as ObjectSchemaToType<P>
  }
}