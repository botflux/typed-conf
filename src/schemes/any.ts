import {type BaseSchema, kType} from "./base.js";

export type AnySchema<T> = BaseSchema<T> & {
  type: 'any'
}

function coerce(value: unknown) {
  return value
}

export function any<T = any>(): AnySchema<T> {
  return {
    type: 'any',
    jsonSchema: {},
    aliases: [],
    [kType]: '' as T,
    coerce,
  }
}