import {type BaseSchema, kType} from "./base.js";
import type {Alias} from "../alias.js";

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
}

export function array<T>(opts: ArrayOpts<T>): ArraySchema<T[]> {
  const { item, aliases = [], maxItems, minItems } = opts

  return {
    jsonSchema: {
      type: 'array',
      items: item.jsonSchema,
      minItems,
      maxItems
    },
    aliases,
    items: item,
    type: 'array',
    [kType]: [] as T[],
    coerce
  }
}

export function isArray(schema: BaseSchema<unknown>): schema is ArraySchema<unknown> {
  return 'type' in schema && schema.type === 'array'
}