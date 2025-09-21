import {type Alias, type BaseSchema, type BaseSchemaBuilder, kType} from "./base.js";
import type {Visitor} from "../visitor/visitor.js";

export interface BooleanSchemaBuilder extends BaseSchemaBuilder<BooleanSchema> {
  optional(): this

  aliases(...aliases: Alias[]): this
}

export type BooleanSchema = {
  type: "boolean"
} & BaseSchema<boolean>

class BooleanSchemaCls implements BooleanSchemaBuilder {
  schema: BooleanSchema = {
    [kType]: false as true,
    optional: false,
    aliases: [],
    accept<R>(visitor: Visitor<R>): R {
      return visitor.visitBoolean(this)
    },
    type: "boolean",
    coerce: (value: unknown) => {
      if (typeof value !== "string") {
        return value
      }

      const lowercase = value.toLowerCase()

      if (lowercase === "false") return false
      if (lowercase === "true") return true

      return value
    },
    schema: {
      type: "boolean"
    }
  }

  optional(): this {
    this.schema.optional = true
    return this
  }

  aliases(...aliases: Alias[]): this {
    this.schema.aliases = [...this.schema.aliases, ...aliases]
    return this
  }
}

export function boolean(): BooleanSchemaBuilder {
  return new BooleanSchemaCls()
}