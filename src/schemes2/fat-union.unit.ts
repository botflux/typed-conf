import {describe, it} from "node:test";
import {object} from "./object.js";
import {string} from "./string.js";
import {expect} from "expect";
import {type BaseSchema, kType} from "./base.js";
import type {JSONSchema} from "json-schema-to-typescript";
import {expectTypeOf} from "expect-type";
import {envAlias} from "../sources/envs/envs.js";
import type {Alias} from "../schemes/base.js";

export type ObjectToFatUnion<T extends Record<string, BaseSchema<unknown>>> = {
  [K in keyof T]: { [P in K]: T[P][typeof kType] }
}[keyof T]

export type FatUnionSchema<U extends Record<string, BaseSchema<unknown>>> = BaseSchema<ObjectToFatUnion<U>> & {
  type: 'fat_union'
  schemes: U
}

export type FatUnionOpts = {
  aliases?: Alias[]
}

function fatUnion<U extends Record<string, BaseSchema<unknown>>>(union: U, opts: FatUnionOpts = {}): FatUnionSchema<U> {
  const { aliases = [] } = opts

  const oneOf = Object.entries(union).map(([key, value]) => ({
    type: 'object',
    properties: {
      [key]: value.schema
    },
    required: [ key ],
    additionalProperties: false,
  } as JSONSchema))

  return {
    type: 'fat_union',
    schemes: union,
    aliases,
    schema: {
      type: 'object',
      oneOf
    },
    [kType]: '' as unknown as ObjectToFatUnion<U>
  }
}

describe('fatUnion', function () {
  it('should be able to declare a fat union', function () {
    // Given
    // When
    const schema = fatUnion({
      vault: object({ secret: string() }),
      file: object({ path: string() }),
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      schema: {
        type: 'object',
        oneOf: [
          {
            type: 'object',
            properties: {
              vault: {
                type: 'object',
                properties: {
                  secret: {
                    type: 'string'
                  }
                },
                required: ['secret'],
                additionalProperties: false,
              }
            },
            required: [ 'vault' ],
            additionalProperties: false,
          },
          {
            type: 'object',
            properties: {
              file: {
                type: 'object',
                properties: {
                  path: {
                    type: 'string'
                  }
                },
                required: ['path'],
                additionalProperties: false,
              }
            },
            required: ['file'],
            additionalProperties: false,
          }
        ]
      },
      schemes: { vault: object({ secret: string() }), file: object({ path: string() }) }
    }))
  })

  it('should be able to type correctly', function () {
    // Given
    // When
    const schema = fatUnion({
      vault: object({ secret: string() }),
      file: object({ path: string() }),
    })

    // Then
    expectTypeOf(schema[kType]).toEqualTypeOf<{ vault: { secret: string } } | { file: { path: string } }>()
  })

  it('should have no aliases by default', function () {
    // Given
    // When
    const schema = fatUnion({ foo: string(), bar: string() })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: []
    }))
  })

  it('should be able to declare aliases', function () {
    // Given
    // When
    const schema = fatUnion({ foo: string(), bar: string() }, {
      aliases: [ envAlias('FOO') ]
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: [envAlias('FOO')]
    }))
  })
})