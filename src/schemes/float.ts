import {type Alias, type BaseSchema, type BaseSchemaBuilder, kType} from "./base.js";
import type {Visitor} from "../visitor/visitor.js";

export interface FloatSchemaBuilder extends BaseSchemaBuilder<FloatSchema> {
  optional(): this

  aliases(...aliases: Alias[]): this

  secret(): this
}

export type FloatSchema = {
  type: "float"
} & BaseSchema<number>

class FloatSchemaCls implements FloatSchemaBuilder {
  schema: FloatSchema = {
    type: "float",
    [kType]: 0,
    aliases: [],
    accept<R>(visitor: Visitor<R>): R {
      return visitor.visitFloat(this)
    },
    optional: false,
    coerce: (value: unknown) => {
      if (typeof value !== "string") {
        return value
      }

      const parsed = Number.parseFloat(value)

      if (Number.isNaN(parsed)) {
        return value
      }

      return parsed
    },
    schema: {
      type: "number"
    },
    secret: false
  }

  optional(): this {
    this.schema.optional = true
    return this
  }

  aliases(...aliases: Alias[]): this {
    this.schema.aliases = [...this.schema.aliases, ...aliases]
    return this
  }

  secret(): this {
    this.schema.secret = true
    return this
  }
}

export function float(): FloatSchemaBuilder {
  return new FloatSchemaCls()
}