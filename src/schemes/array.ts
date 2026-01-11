import {type BaseSchema, kType} from "./base.js";
import type {Alias} from "../alias.js";
import {Array as TypeBoxArray} from "typebox";

export type ArraySchema<T> = BaseSchema<T> & {
  type: 'array'
  items: BaseSchema<ItemOf<T>>
  coerce: (value: unknown) => unknown
}
export type ItemOf<T> = T extends Array<infer U> ? U : T;

function coerce(this: ArraySchema<unknown>, value: unknown): unknown {
  if (!Array.isArray(value)) {
     return value
  }

  return value.map(v => this.items.coerce?.(v) ?? v)
}

export type ArrayOpts<T> = {
  item: BaseSchema<T>
  minItems?: number
  maxItems?: number
  aliases?: Alias[]
  deprecated?: boolean
}

export function array<T>(opts: ArrayOpts<T>): ArraySchema<T[]> {
  const { item, aliases = [], maxItems, minItems, deprecated = false } = opts

  return {
    jsonSchema: {
      type: 'array',
      items: item.jsonSchema,
      minItems,
      maxItems,
      ...deprecated && { deprecated: true }
    },
    aliases,
    items: item,
    type: 'array',
    [kType]: [] as T[],
    coerce,
    deprecated,
    validationSchema: TypeBoxArray(opts.item.validationSchema, {
      ...opts.minItems !== undefined && {
        minItems: opts.minItems
      },
      ...opts.maxItems !== undefined && {
        maxItems: opts.maxItems
      }
    })
  }
}

export function isArray(schema: BaseSchema<unknown>): schema is ArraySchema<unknown> {
  return 'type' in schema && schema.type === 'array'
}