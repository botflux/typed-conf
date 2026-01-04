import {type BaseSchema, kType} from "./base.js";
import type {JSONSchema} from "json-schema-to-typescript";
import type {FatUnionSchema, ObjectToFatUnion} from "./fat-union.unit.js";
import type {Alias} from "../alias.js";
import {Object as TypeBoxObject, Union} from "@sinclair/typebox";

export type FatUnionOpts = {
  aliases?: Alias[]
  deprecated?: boolean
}

export function fatUnion<U extends Record<string, BaseSchema<unknown>>>(union: U, opts: FatUnionOpts = {}): FatUnionSchema<U> {
  const {aliases = [], deprecated = false} = opts

  const beforeRefOneOfs = Object.entries(union).map(([key, value]) => ({
    type: 'object',
    properties: {
      [key]: value.jsonSchema
    },
    required: [key],
    additionalProperties: false,
  } as JSONSchema))

  return {
    type: 'fat_union',
    schemes: union,
    aliases,
    jsonSchema: {
      type: 'object',
      oneOf: beforeRefOneOfs,
      ...deprecated && { deprecated: true }
    },
    [kType]: '' as unknown as ObjectToFatUnion<U>,
    deprecated,
    validationSchema: Union(
      Object.entries(union).map(([key, value]) =>
        TypeBoxObject({ [key]: value.validationSchema! }))
    )
  }
}