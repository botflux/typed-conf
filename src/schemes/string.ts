import {type Alias, type BaseSchema, type BaseSchemaBuilder, kType} from "./base.js";
import type {Visitor} from "../visitor/visitor.js";

export interface StringSchemaBuilder extends BaseSchemaBuilder<StringSchema> {
  optional(): this

  aliases(...aliases: Alias[]): this
}

export type StringSchema = {
  type: "string"
} & BaseSchema<string>

class StringSchemaCls implements StringSchemaBuilder {
  schema: StringSchema = {
    [kType]: "string" as const,
    optional: false,
    aliases: [],
    accept<R>(visitor: Visitor<R>): R {
      return visitor.visitString(this)
    },
    type: "string",
    schema: {
      type: "string",
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

export function string(): StringSchemaBuilder {
  return new StringSchemaCls()
}