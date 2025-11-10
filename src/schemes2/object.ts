import type { Alias } from "../schemes/base.js";
import {type BaseSchema, kType} from "./base.js";
import {hasOptionalSchemaInChain} from "./optional.js";

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

  const jsonSchemaProps = Object.fromEntries(Object.entries(props).map(([key, value]) => [key, value.schema]))
  const requiredProps = Object.entries(props)
    .filter(([, schema]) => !hasOptionalSchemaInChain(schema))
    .map(([key]) => key)

  return {
    type: 'object',
    props,
    aliases,
    schema: {
      type: 'object',
      properties: jsonSchemaProps,
      required: requiredProps,
      additionalProperties: false,
    },
    [kType]: '' as ObjectSchemaToType<P>
  }
}