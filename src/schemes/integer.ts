import {type Alias, type BaseSchema, type BaseSchemaBuilder, kType} from "./base.js";
import type {Visitor} from "../visitor/visitor.js";

export type IntegerSchema = {
  type: "integer"
} & BaseSchema<number>

class IntegerSchemaCls implements BaseSchemaBuilder<IntegerSchema> {
  schema: IntegerSchema = {
    [kType]: 0,
    optional: false,
    aliases: [],
    accept<R>(visitor: Visitor<R>): R {
      return visitor.visitInteger(this)
    },
    type: "integer",
    coerce: (value: unknown) => {
      if (typeof value !== "string") {
        return value
      }

      const parsed = Number.parseInt(value)

      if (Number.isNaN(parsed)) {
        return value
      }

      return parsed
    },
    schema: {
      type: "integer"
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

export function integer(): BaseSchemaBuilder<IntegerSchema> {
  return new IntegerSchemaCls()
}