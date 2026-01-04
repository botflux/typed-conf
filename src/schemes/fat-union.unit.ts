import {describe, it} from "node:test";
import {object} from "./object.js";
import {string} from "./string.js";
import {expect} from "expect";
import {type BaseSchema, kType} from "./base.js";
import {expectTypeOf} from "expect-type";
import {fatUnion} from "./fat-union.js";
import { envAlias } from "../sources/env/alias.js";
import { Union, String, Object } from '@sinclair/typebox'

export type ObjectToFatUnion<T extends Record<string, BaseSchema<unknown>>> = {
  [K in keyof T]: { [P in K]: T[P][typeof kType] }
}[keyof T]

export type FatUnionSchema<U extends Record<string, BaseSchema<unknown>>> = BaseSchema<ObjectToFatUnion<U>> & {
  type: 'fat_union'
  schemes: U
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
      jsonSchema: {
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

  it('should have a validation schema', function () {
    // Given
    // When
    const schema = fatUnion({ foo: string(), bar: string() })

    // Then
    expect(schema.validationSchema).toEqual(Union([
      Object({ foo: String() }),
      Object({ bar: String() }),
    ]))
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

  it('should be able to mark as deprecated', function () {
    // Given
    // When
    const schema = fatUnion({
      foo: string(),
      bar: string(),
    }, {
      deprecated: true
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      deprecated: true,
      jsonSchema: expect.objectContaining({ deprecated: true })
    }))
  })

  it('should not be deprecated by default', function () {
    // Given
    // When
    const schema = fatUnion({ foo: string(), bar: string() })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      deprecated: false,
    }))
  })
})