import type {Alias} from "../schemes/base.js";
import {type BaseSchema, kType} from "./base.js";

export interface StringSchema<T> extends BaseSchema<T> {
  type: 'string'
}

export interface StringSchemaBuilder<T> {
  plain: StringSchema<T>
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

  aliases(...aliases: Alias[]): StringSchemaBuilder<T> {
    return new StringBuilder({
      ...this.plain,
      aliases: [...this.plain.aliases, ...aliases],
    })
  }
}

export type StringOpts = {
  minLength?: number
  maxLength?: number
  aliases?: Alias[]
}

export function string(opts: StringOpts = {}): StringSchema<string> {
  const { aliases = [], minLength, maxLength } = opts

  return {
    [kType]: '' as unknown as string,
    type: 'string',
    schema: {
      type: 'string',
      minLength,
      maxLength,
    },
    aliases,
  }
}