import {describe, it} from "node:test";
import {object} from "./object.js";
import {string} from "./string.js";
import {expect} from "expect";
import {type BaseSchema, kType} from "./base.js";
import {expectTypeOf} from "expect-type";
import {envAlias} from "../sources/envs/envs.js";
import type {Alias} from "../schemes/base.js";

type Prettier<T> = {
  [K in keyof T]: T[K]
} & {}

type UnwrapSchemaType<S extends BaseSchema<unknown>> = S extends BaseSchema<infer T> ? T : never

type UnionToIntersection<U> =
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void
    ? I
    : never

export type IntersectionSchema<S extends BaseSchema<unknown>> = BaseSchema<Prettier<UnionToIntersection<UnwrapSchemaType<S>>>> & {
  type: 'intersection'
  schemes: S[]
}

export type IntersectionOpts = {
  aliases?: Alias[]
}

function intersection<S extends BaseSchema<unknown>>(schemes: S[], opts: IntersectionOpts = {}): IntersectionSchema<S> {
  const { aliases = [] } = opts

  return {
    type: 'intersection',
    schemes,
    aliases,
    [kType]: "" as unknown as UnionToIntersection<UnwrapSchemaType<S>>,
    schema: {
      type: 'object',
      allOf: schemes.map(s => s.schema)
    },
  }
}

describe('intersection', function () {
  it('should be able to merge types', function () {
    // Given
    // When
    const schema = intersection([
      object({ foo: string() }),
      object({ bar: string() }),
    ])

    // Then
    expect(schema).toEqual(expect.objectContaining({
      type: 'intersection',
      schemes: [
        object({ foo: string() }),
        object({ bar: string() }),
      ],
      schema: {
        type: 'object',
        allOf: [
          {
            type: 'object',
            properties: {
              foo: {
                type: 'string',
                maxLength: undefined,
                minLength: undefined,
              }
            },
            required: ['foo'],
            additionalProperties: false
          },
          {
            type: 'object',
            properties: {
              bar: {
                type: 'string',
                maxLength: undefined,
                minLength: undefined,
              }
            },
            additionalProperties: false,
            required: ['bar'],
          }
        ]
      }
    }))
  })

  it('should be typed correctly', function () {
    // Given
    // When
    const schema = intersection([
      object({ foo: string() }),
      object({ bar: string() }),
    ])

    // Then
    expectTypeOf(schema[kType]).toEqualTypeOf<{ foo: string, bar: string }>()
  })

  it('should have no aliases by default', function () {
    // Given
    // When
    const schema = intersection([
      object({ foo: string() }),
      object({ bar: string() }),
    ])

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: []
    }))
  })

  it('should be able to declare aliases', function () {
    // Given
    // When
    const schema = intersection([
      object({ foo: string() }),
      object({ bar: string() }),
    ], {
      aliases: [ envAlias('FOO') ]
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: [envAlias('FOO')]
    }))
  })
})