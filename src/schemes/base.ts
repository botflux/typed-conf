import type {JSONSchema} from "json-schema-to-typescript";
import {isObject} from "./object.js";
import type {Alias} from "../alias.js";
import { type TSchema } from 'typebox'

export const kType = Symbol('kType')

export type Mapping<T, U> = {
  map: (value: U) => T
  baseSchema: BaseSchema<U>
}

/**
 * A leaf is a schema that does not have any nested entries.
 */
export type Leaf = { type: 'leaf' }

/**
 * A branch is a schema that has nested entries.
 */
export type Branch = { type: 'branch', nestedEntries: NestedEntry[] }

/**
 * Some schemes can be both branches and leaves at the same time.
 * Union types are a good example of this.
 */
export type LeafAndBranch = { type: 'leaf_and_branch', nestedEntries: NestedEntry[] }

export type NodeType = Leaf | Branch | LeafAndBranch

/**
 * A nested entry is a tuple of:
 * - the path to the nested entry
 * - the schema of the nested entry
 */
export type NestedEntry = [string[], BaseSchema<unknown>]

export interface BaseSchema<T, U = unknown> {
  /**
   * This property is only used to express the current schema's TypeScript type.
   */
  [kType]: T

  /**
   * A JSON schema representing the current schema.
   */
  jsonSchema: JSONSchema

  /**
   * A list of aliases from which this schema can be loaded.
   */
  aliases: Alias[]

  /**
   * A function that is used to coerce loaded configs.
   *
   * @param value
   */
  coerce?: (value: unknown) => unknown
  mapping?: Mapping<T, U>

  /**
   * The default value of this schema.
   */
  defaultValue?: T

  /**
   * True to mark the schema as deprecated; otherwise false.
   * This flag can be used for various mechanisms from logging warning when using a deprecated config entry,
   * to documentation generation.
   */
  deprecated: boolean

  /**
   * The TypeBox schema that is used to validate the loaded config.
   */
  validationSchema: TSchema
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