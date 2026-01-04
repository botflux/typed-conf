import {type BaseSchema, kType} from "./base.js";
import {Any} from "typebox";

export type AnyOpts = { deprecated?: boolean }

export type AnySchema<T> = BaseSchema<T> & {
  type: 'any'
}

function coerce(value: unknown) {
  return value
}

export function any<T = any>(opts: AnyOpts = {}): AnySchema<T> {
  const {deprecated = false} = opts

  return {
    type: 'any',
    jsonSchema: {...deprecated && {deprecated: true}},
    aliases: [],
    [kType]: '' as T,
    coerce,
    deprecated,
    validationSchema: Any()
  }
}