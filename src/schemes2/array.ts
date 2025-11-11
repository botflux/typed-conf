import {type BaseSchema, kType} from "./base.js";
import type {Alias} from "../schemes/base.js";

export type ArraySchema<T> = BaseSchema<T> & {
  type: 'array'
  items: BaseSchema<ItemOf<T>>
}
export type ItemOf<T> = T extends Array<infer U> ? U : T;


export type ArrayOpts<T> = {
  item: BaseSchema<T>
  minItems?: number
  maxItems?: number
  aliases?: Alias[]
}

export function array<T>(opts: ArrayOpts<T>): ArraySchema<T[]> {
  const { item, aliases = [], maxItems, minItems } = opts

  return {
    schema: {
      type: 'array',
      items: item.schema,
      minItems,
      maxItems
    },
    aliases,
    items: item,
    type: 'array',
    [kType]: [] as T[]
  }
}