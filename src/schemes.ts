export const kType = Symbol("type")

export type BaseSchema<T> = {
  [kType]: T
  coerce?: (value: unknown) => unknown
}

export type StringSchema = {
  type: "string"
} & BaseSchema<string>

export type BooleanSchema = {
  type: "boolean"
} & BaseSchema<boolean>

export type ObjectSchema<T extends ObjectSpec> = {
  type: "object"
  spec: T
} & BaseSchema<ToRecord<T>>

export type ToRecord<ObjectSpec extends Record<string, BaseSchema<unknown>>> = {
  [K in keyof ObjectSpec]: ObjectSpec[K][typeof kType]
}

export type ObjectSpec = Record<string, BaseSchema<unknown>>

export function object<T extends ObjectSpec>(spec: T): ObjectSchema<T> {
  return {
    type: "object",
    spec,
    [kType]: {} as ToRecord<T>
  }
}

export function string(): StringSchema {
  return {
    type: "string",
    [kType]: ""
  }
}

export function boolean(): BooleanSchema {
  return {
    type: "boolean",
    [kType]: false,
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