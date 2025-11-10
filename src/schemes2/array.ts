import {type BaseSchema, type BaseSchemaBuilder, kType} from "./base.js";
import type {Alias} from "../schemes/base.js";

export type ArraySchema<T> = BaseSchema<T> & {
  type: 'array'
  items: BaseSchema<ItemOf<T>>
}
export type ItemOf<T> = T extends Array<infer U> ? U : T;

export interface ArraySchemaBuilder<T> extends BaseSchemaBuilder<ArraySchema<T>> {
  maxLength(maxLength: number): ArraySchemaBuilder<T>;

  minLength(minLength: number): ArraySchemaBuilder<T>
}

class ArrayBuilder<T> implements ArraySchemaBuilder<T> {
  plain: ArraySchema<T>;

  constructor(plain: ArraySchema<T>) {
    this.plain = plain;
  }

  maxLength(maxLength: number): ArraySchemaBuilder<T> {
    return new ArrayBuilder({
      ...this.plain,
      schema: {
        ...this.plain.schema,
        maxLength
      }
    })
  }

  minLength(minLength: number): ArraySchemaBuilder<T> {
    return new ArrayBuilder({
      ...this.plain,
      schema: {
        ...this.plain.schema,
        minLength
      }
    })
  }
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