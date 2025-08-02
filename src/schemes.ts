export const kType = Symbol("type")

export type BaseSchema<T> = {
  [kType]: T
}

export type StringSchema = {
  type: "string"
} & BaseSchema<string>

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