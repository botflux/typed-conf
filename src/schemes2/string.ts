import type {Alias} from "../schemes/base.js";
import type {JSONSchema} from "json-schema-to-typescript";

export const kType = Symbol('kType')

export interface BaseSchema<T> {
  [kType]: T
  schema: JSONSchema
  optional: boolean
  aliases: Alias[]
  secret: boolean
}

export interface BaseSchemaBuilder<T> {
  plain: BaseSchema<T>

  optional(): StringSchemaBuilder<T | undefined>
  secret(): StringSchemaBuilder<T>
  aliases(...aliases: Alias[]): StringSchemaBuilder<T>
}

export class BaseBuilder<T> implements BaseSchemaBuilder<T> {
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

export interface StringSchema<T> extends BaseSchema<T> {
  type: 'string'
}

export interface StringSchemaBuilder<T> extends BaseSchemaBuilder<T> {}

class StringBuilder<T> extends BaseBuilder<T> implements StringSchemaBuilder<T> {
  constructor(plain: StringSchema<T>) {
    super(plain)
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