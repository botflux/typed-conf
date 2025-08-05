export const kType = Symbol("type")

export type BaseSchema<T> = {
  [kType]: T
  coerce?: (value: unknown) => unknown
  _aliases: Alias[]
}

export type Alias = { id: string, sourceKey: string }

export type StringSchemaBuilder = {
  type: "string"
  /**
   * Define aliases for this value.
   *
   * @param aliases
   */
  aliases(...aliases: Alias[]): StringSchemaBuilder
} & BaseSchema<string>

export type BooleanSchema = {
  type: "boolean"
} & BaseSchema<boolean>

export type IntegerSchema = {
  type: "integer"
} & BaseSchema<number>

export type FloatSchema = {
  type: "float"
} & BaseSchema<number>

export type ObjectSchema<T extends ObjectSpec> = {
  type: "object"
  spec: T
} & BaseSchema<ToRecord<T>>

export type SecretSchema = {
  type: "secret"
} & BaseSchema<string>

export type ToRecord<ObjectSpec extends Record<string, BaseSchema<unknown>>> = {
  [K in keyof ObjectSpec]: ObjectSpec[K][typeof kType]
}

export type ObjectSpec = Record<string, BaseSchema<unknown>>

export function object<T extends ObjectSpec>(spec: T): ObjectSchema<T> {
  return {
    type: "object",
    spec,
    [kType]: {} as ToRecord<T>,
    _aliases: [],
  }
}

class StringSchemaCls implements StringSchemaBuilder {
  type: "string" = "string";
  [kType]: string = "";

  _aliases: Alias[] = []

  aliases(...aliases: Alias[]): StringSchemaBuilder {
    this._aliases = aliases
    return this
  }
}

export function string(): StringSchemaBuilder {
  return new StringSchemaCls()
}

export function secret(): SecretSchema {
  return {
    type: "secret",
    [kType]: "",
    _aliases: [],
  }
}

export function boolean(): BooleanSchema {
  return {
    type: "boolean",
    [kType]: false,
    _aliases: [],
    coerce: (value: unknown) => {
      if (typeof value !== "string") {
        return value
      }

      const lowercase = value.toLowerCase()

      if (lowercase === "false") return false
      if (lowercase === "true") return true

      return value
    }
  }
}

export function integer(): IntegerSchema {
  return {
    type: "integer",
    [kType]: 0,
    _aliases: [],
    coerce: (value: unknown) => {
      if (typeof value !== "string") {
        return value
      }

      const parsed = Number.parseInt(value)

      if (Number.isNaN(parsed)) {
        return value
      }

      return parsed
    }
  }
}


export function float(): FloatSchema {
  return {
    type: "float",
    [kType]: 0,
    _aliases: [],
    coerce: (value: unknown) => {
      if (typeof value !== "string") {
        return value
      }

      const parsed = Number.parseFloat(value)

      if (Number.isNaN(parsed)) {
        return value
      }

      return parsed
    }
  }
}

export type Entry = {
  key: string[]
  value: BaseSchema<unknown>
}

export function flatten(config: ObjectSchema<ObjectSpec>, base: string[] = []): Entry[] {
  const entries = Object.entries(config.spec)

  return entries.flatMap(([k, value]) => isObject(value)
    ? flatten(value, [...base, k])
    : { key: [...base, k], value } as Entry)
}

function isObject(schema: BaseSchema<unknown>): schema is ObjectSchema<ObjectSpec> {
  return "type" in schema && schema.type === "object"
}