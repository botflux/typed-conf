import {type BaseSchema, kType} from "./base.js";
import type {Alias} from "../schemes/base.js";

export type FloatSchema<T> = BaseSchema<T> & {
  type: 'float'
}

export interface FloatSchemaBuilder<T> {
  plain: FloatSchema<T>

  optional(): FloatSchemaBuilder<T | undefined>

  aliases(...aliases: Alias[]): FloatSchemaBuilder<T>

  min(minimum: number): FloatSchemaBuilder<T>;

  max(maximum: number): FloatSchemaBuilder<T>;

  secret(): FloatSchemaBuilder<T>;
}

class FloatBuilder<T> implements FloatSchemaBuilder<T> {
  plain: FloatSchema<T>

  constructor(
    plain: FloatSchema<T>
  ) {
    this.plain = plain
  }

  secret(): FloatSchemaBuilder<T> {
    return new FloatBuilder({
      ...this.plain,
      secret: true,
    })
  }

  aliases(...aliases: Alias[]): FloatSchemaBuilder<T> {
    return new FloatBuilder({
      ...this.plain,
      aliases: [...this.plain.aliases, ...aliases],
    })
  }

  optional(): FloatSchemaBuilder<T | undefined> {
    return new FloatBuilder({
      ...this.plain,
      optional: true,
    })
  }

  min(minimum: number): FloatSchemaBuilder<T> {
    if (this.plain.schema.maximum !== undefined && this.plain.schema.maximum && minimum > this.plain.schema.maximum) {
      throw new Error(`min must be <= max, got ${minimum}`)
    }

    return new FloatBuilder({
      ...this.plain,
      schema: {
        ...this.plain.schema,
        minimum,
      },
    })
  }

  max(maximum: number): FloatSchemaBuilder<T> {
    if (this.plain.schema.minimum !== undefined && this.plain.schema.minimum && maximum < this.plain.schema.minimum) {
      throw new Error(`max must be >= min, got ${maximum}`)
    }

    return new FloatBuilder({
      ...this.plain,
      schema: {
        ...this.plain.schema,
        maximum,
      },
    })
  }
}

export function float(): FloatSchemaBuilder<number> {
  return new FloatBuilder({
    schema: {
      type: 'number'
    },
    [kType]: 0 as number,
    optional: false,
    aliases: [],
    secret: false,
    type: 'float',
  })
}