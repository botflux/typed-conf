import {type BaseSchema, kType} from "./base.js";
import type {Alias} from "../schemes/base.js";

export type IntegerSchema<T> = BaseSchema<T> & {
  type: 'integer'
}

export interface IntegerSchemaBuilder<T> {
  plain: IntegerSchema<T>
  optional: () => IntegerSchemaBuilder<T | undefined>

  secret(): IntegerSchemaBuilder<T>;
  aliases(...alias: Alias[]): IntegerSchemaBuilder<T>
  min(minimum: number): IntegerSchemaBuilder<T>;
  max(maximum: number): IntegerSchemaBuilder<T>;
}

class IntegerBuilder<T> implements IntegerSchemaBuilder<T> {
  plain: IntegerSchema<T>

  constructor(plain: IntegerSchema<T>) {
    this.plain = plain;
  }

  max(maximum: number): IntegerSchemaBuilder<T> {
    if (this.plain.schema.minimum && maximum < this.plain.schema.minimum) {
      throw new Error(`max must be >= min, got ${maximum}`)
    }

    return new IntegerBuilder({
      ...this.plain,
      schema: {
        ...this.plain.schema,
        maximum
      }
    })
  }

  min(minimum: number): IntegerSchemaBuilder<T> {
    if (this.plain.schema.maximum && minimum > this.plain.schema.maximum) {
      throw new Error(`min must be <= max, got ${minimum}`)
    }

    return new IntegerBuilder({
      ...this.plain,
      schema: {
        ...this.plain.schema,
        minimum
      }
    })
  }

  secret(): IntegerSchemaBuilder<T> {
    return new IntegerBuilder({
      ...this.plain,
      secret: true,
    })
  }

  aliases(...alias: Alias[]): IntegerSchemaBuilder<T> {
    return new IntegerBuilder({
      ...this.plain,
      aliases: [...this.plain.aliases, ...alias],
    })
  }

  optional(): IntegerSchemaBuilder<T | undefined> {
    return new IntegerBuilder({
      ...this.plain,
      optional: true
    })
  }
}

export function integer(): IntegerSchemaBuilder<number> {
  return new IntegerBuilder({
    type: 'integer',
    [kType]: 0,
    aliases: [],
    schema: {
      type: 'integer'
    },
    secret: false,
    optional: false
  })
}