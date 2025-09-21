import {type Alias, type BaseSchema, type BaseSchemaBuilder, kType} from "./base.js";
import type {Visitor} from "../visitor/visitor.js";

export interface SecretSchemaBuilder extends BaseSchemaBuilder<SecretSchema> {
  optional(): this

  aliases(...aliases: Alias[]): this
}

export type SecretSchema = {
  type: "secret"
} & BaseSchema<string>

class SecretSchemaCls implements SecretSchemaBuilder {
  schema: SecretSchema = {
    [kType]: "secret" as const,
    optional: false,
    aliases: [],
    accept<R>(visitor: Visitor<R>): R {
      return visitor.visitSecret(this)
    },
    type: "secret",
    schema: {
      type: "string"
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

export function secret(): SecretSchemaBuilder {
  return new SecretSchemaCls()
}

export function isSecret(schema: BaseSchema<unknown>): schema is SecretSchema {
  return "type" in schema && schema.type === "secret"
}