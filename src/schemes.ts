import type {Visitor} from "./visitor/visitor.js";
import { type JSONSchema } from "json-schema-to-typescript"

export const kType = Symbol("type")

export type BaseSchema<T> = {
  [kType]: T
  coerce?: (value: unknown) => unknown
  aliases: Alias[]
  optional: boolean
  accept<R>(visitor: Visitor<R>): R
  schema: JSONSchema
}

export interface BaseSchemaBuilder<S extends BaseSchema<unknown>> {
  schema: S
  optional(): this
  aliases(...aliases: Alias[]): this
}

export type Alias = { id: string, sourceKey: string }

export interface StringSchemaBuilder extends BaseSchemaBuilder<StringSchema> {
  optional(): this
  aliases(...aliases: Alias[]): this
}

export type StringSchema = {
  type: "string"
} & BaseSchema<string>

export interface BooleanSchemaBuilder extends BaseSchemaBuilder<BooleanSchema> {
  optional(): this
  aliases(...aliases: Alias[]): this
}

export type BooleanSchema = {
  type: "boolean"
} & BaseSchema<boolean>

export interface IntegerSchemaBuilder extends BaseSchemaBuilder<IntegerSchema> {
  optional(): this
  aliases(...aliases: Alias[]): this
}

export type IntegerSchema = {
  type: "integer"
} & BaseSchema<number>

export interface FloatSchemaBuilder extends BaseSchemaBuilder<FloatSchema> {
  optional(): this
  aliases(...aliases: Alias[]): this
}

export type FloatSchema = {
  type: "float"
} & BaseSchema<number>

export type ObjectSchema<T extends ObjectSpec> = {
  type: "object"
  spec: T
} & BaseSchema<ToRecord<T>>

export interface SecretSchemaBuilder extends BaseSchemaBuilder<SecretSchema> {
  optional(): this
  aliases(...aliases: Alias[]): this
}

export type SecretSchema = {
  type: "secret"
} & BaseSchema<string>

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
      schema: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false
      } as JSONSchema
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

export function object<T extends ObjectSpec>(spec: T): ObjectSchemaBuilder<T> {
  return new ObjectSchemaBuilder(spec)
  // return {
  //   type: "object",
  //   spec,
  //   [kType]: {} as ToRecord<T>,
  //   aliases: [],
  //   accept<R>(visitor: Visitor<R>): R {
  //     return visitor.visitObject(this)
  //   },
  //   optional: false
  // }
}

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

class IntegerSchemaCls implements IntegerSchemaBuilder {
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

export function integer(): IntegerSchemaBuilder {
  return new IntegerSchemaCls()
}

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

export function float(): FloatSchemaBuilder {
  return new FloatSchemaCls()
}

export type Entry = {
  key: string[]
  value: BaseSchema<unknown>
}

export function flatten(config: ObjectSchema<ObjectSpec>, base: string[] = []): Entry[] {
  const entries = Object.entries(config.spec)

  return entries.flatMap(([k, value]) => isObject(value.schema)
    ? flatten(value.schema, [...base, k])
    : { key: [...base, k], value: value.schema } as Entry)
}

function isObject(schema: BaseSchema<unknown>): schema is ObjectSchema<ObjectSpec> {
  return "type" in schema && schema.type === "object"
}

export function isSecret(schema: BaseSchema<unknown>): schema is SecretSchema {
  return "type" in schema && schema.type === "secret"
}