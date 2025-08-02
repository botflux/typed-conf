export type ConfSchema = StringSchema

export type StringSchema = {
  type: "string"
}
export type ObjectSchema<T extends ObjectSpec> = {
  type: "object"
  spec: T
}
export type ObjectSpec = Record<string, ConfSchema>

export function object<T extends ObjectSpec>(spec: T): ObjectSchema<T> {
  return {
    type: "object",
    spec
  }
}

export function string(): StringSchema {
  return {
    type: "string"
  }
}