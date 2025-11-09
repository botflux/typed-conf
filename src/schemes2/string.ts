import type {Alias} from "../schemes/base.js";
import {type BaseSchema, kType} from "./base.js";

export interface StringSchema<T> extends BaseSchema<T> {
  type: 'string'
}

export interface StringSchemaBuilder<T> {
  plain: StringSchema<T>
  optional(): StringSchemaBuilder<T | undefined>
  secret(): StringSchemaBuilder<T>
  aliases(...aliases: Alias[]): StringSchemaBuilder<T>
  minLength(minLength: number): StringSchemaBuilder<T>
  maxLength(maxLength: number): StringSchemaBuilder<T>
}

class StringBuilder<T> implements StringSchemaBuilder<T> {
  plain: StringSchema<T>

  constructor(plain: StringSchema<T>) {
    this.plain = plain
  }

  maxLength(maxLength: number): StringSchemaBuilder<T> {
    return new StringBuilder({
      ...this.plain,
      schema: {
        ...this.plain.schema,
        maxLength
      },
    })
  }

  minLength(minLength: number): StringSchemaBuilder<T> {
    return new StringBuilder({
      ...this.plain,
      schema: {
        ...this.plain.schema,
        minLength
      },
    })
  }

  optional(): StringSchemaBuilder<T | undefined> {
    return new StringBuilder({
      ...this.plain,
      optional: true,
    })
  }

  secret(): StringSchemaBuilder<T> {
    return new StringBuilder({
      ...this.plain,
      secret: true,
    })
  }

  aliases(...aliases: Alias[]): StringSchemaBuilder<T> {
    return new StringBuilder({
      ...this.plain,
      aliases: [...this.plain.aliases, ...aliases],
    })
  }
}

export function string(): StringSchemaBuilder<string> {
  return new StringBuilder({
    [kType]: '' as unknown as string,
    type: 'string',
    schema: {
      type: 'string'
    },
    optional: false,
    aliases: [],
    secret: false
  })
}