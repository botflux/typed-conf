import {type BaseSchema, kType} from "./base.js";
import type {JSONSchema} from "json-schema-to-typescript";
import type {Alias} from "../schemes/base.js";
import type {FatUnionSchema, ObjectToFatUnion} from "./fat-union.unit.js";

export type FatUnionOpts = {
  aliases?: Alias[]
}

export function fatUnion<U extends Record<string, BaseSchema<unknown>>>(union: U, opts: FatUnionOpts = {}): FatUnionSchema<U> {
  const {aliases = []} = opts

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
      oneOf: beforeRefOneOfs
    },
    [kType]: '' as unknown as ObjectToFatUnion<U>
  }
}