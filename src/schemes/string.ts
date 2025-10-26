import {type Alias, type BaseSchema, type BaseSchemaBuilder, kType} from "./base.js";
import type {Visitor} from "../visitor/visitor.js";

export type StringSchema = {
  type: "string"
  secret: boolean
} & BaseSchema<string>

export interface StringSchemaBuilder extends BaseSchemaBuilder<StringSchema> {
  minLength(minLength: number): this
  maxLength(maxLength: number): this;
}

class StringSchemaCls implements StringSchemaBuilder {
  maxLength(maxLength: number): this {
    this.schema.schema.maxLength = maxLength
    return this
  }
  minLength(minLength: number): this {
    this.schema.schema.minLength = minLength
    return this
  }
  schema: StringSchema = {
    [kType]: "string" as const,
    secret: false,
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

  secret(): this {
    this.schema.secret = true
    return this
  }
}

export function string(): StringSchemaBuilder {
  return new StringSchemaCls()
}