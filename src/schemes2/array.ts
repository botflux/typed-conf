import {type BaseSchema, type BaseSchemaBuilder, kType} from "./base.js";

export type ArraySchema<T> = BaseSchema<T> & {
  type: 'array'
  items: BaseSchemaBuilder<BaseSchema<ItemOf<T>>>
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

  secret(): ArraySchemaBuilder<T> {
    return new ArrayBuilder({
      ...this.plain,
      secret: true
    })
  }

  optional(): ArraySchemaBuilder<T> {
    return new ArrayBuilder({
      ...this.plain,
      optional: true
    })
  }
}

export function array<T>(item: BaseSchemaBuilder<BaseSchema<T>>): ArraySchemaBuilder<T[]> {
  return new ArrayBuilder({
    schema: {
      type: 'array',
      items: item.plain.schema
    },
    secret: false,
    aliases: [],
    items: item,
    type: 'array',
    optional: false,
    [kType]: [] as T[]
  })
}