import type {Alias} from "../schemes/base.js";

export const kType = Symbol('kType')

export interface StringSchema<T> {
  [kType]: T
  type: 'string'
  schema: {
    type: 'string'
  }
  optional: boolean
  aliases: Alias[]
  secret: boolean
}

export interface StringSchemaBuilder<T> {
  plain: StringSchema<T>

  optional(): StringSchemaBuilder<T | undefined>
  secret(): StringSchemaBuilder<T>
  aliases(...aliases: Alias[]): StringSchemaBuilder<T>
}

class StringBuilder<T> implements StringSchemaBuilder<T> {
  plain: StringSchema<T>

  constructor(plain: StringSchema<T>) {
    this.plain = plain
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