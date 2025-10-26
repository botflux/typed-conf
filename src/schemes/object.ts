import {type Alias, type BaseSchema, type BaseSchemaBuilder, kType} from "./base.js";
import type {Visitor} from "../visitor/visitor.js";
import type {JSONSchema} from "json-schema-to-typescript";
import {after} from "node:test";

export type ObjectSchema<T extends ObjectSpec> = {
  type: "object"
  spec: T
} & BaseSchema<ToRecord<T>>
export type ToRecord<ObjectSpec extends Record<string, BaseSchemaBuilder<BaseSchema<unknown>>>> = {
  [K in keyof ObjectSpec]: ObjectSpec[K]["schema"][typeof kType]
}
export type ObjectSpec = Record<string, BaseSchemaBuilder<BaseSchema<unknown>>>

export class ObjectSchemaBuilder<T extends ObjectSpec> implements BaseSchemaBuilder<ObjectSchema<T>> {
  schema: ObjectSchema<T>

  constructor(spec: T) {
    this.schema = {
      type: "object",
      optional: false,
      [kType]: {} as ToRecord<T>,
      aliases: [],
      accept<R>(visitor: Visitor<R>): R {
        return visitor.visitObject(this)
      },
      spec,
      schema: schemaToJSONSchema(spec, false),
      afterRefSchema: schemaToJSONSchema(spec, true),
      secret: false
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

export function object<T extends ObjectSpec>(spec: T): ObjectSchemaBuilder<T> {
  return new ObjectSchemaBuilder(spec)
}

export function isObject(schema: BaseSchema<unknown>): schema is ObjectSchema<ObjectSpec> {
  return "type" in schema && schema.type === "object"
}

function schemaToJSONSchema(schema: ObjectSpec, afterRef: boolean): JSONSchema {
  const entries = Object.entries(schema)

  const props = entries.map(([key, schema ]) => [
    key,
    afterRef
      ? schema.schema.afterRefSchema ?? schema.schema.schema
      : schema.schema.schema
  ])

  const required = entries
    .filter(([, schema ]) => !schema.schema.optional)
    .map(([ k ]) => k)

  return {
    type: "object",
    additionalProperties: false,
    properties: Object.fromEntries(props),
    required
  }
}