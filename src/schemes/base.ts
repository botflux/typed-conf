import type {JSONSchema} from "json-schema-to-typescript";
import {isObject} from "./object.js";
import type {Alias} from "../alias.js";

export const kType = Symbol('kType')

export type Mapping<T, U> = {
  map: (value: U) => T
  baseSchema: BaseSchema<U>
}

export interface BaseSchema<T, U = unknown> {
  [kType]: T
  jsonSchema: JSONSchema
  aliases: Alias[]
  coerce?: (value: unknown) => unknown
  mapping?: Mapping<T, U>
  defaultValue?: T
}


export function getSchemaAtPath(schema: BaseSchema<unknown>, path: string[]) {
  return path.reduce(
    (s: BaseSchema<unknown> | undefined, chunk, i) => {
      if (s === undefined)
        return undefined

      if (!isObject(s)) {
        throw new Error(`Cannot get ${path.join('.')} because ${path.at(i - 1)} is not an object schema`)
      }
      return s.props[chunk]
    },
    schema
  )
}