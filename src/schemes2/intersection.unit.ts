import {describe, it} from "node:test";
import {object} from "./object.js";
import {string} from "./string.js";
import {expect} from "expect";
import {kType} from "./base.js";
import {expectTypeOf} from "expect-type";
import {envAlias} from "../sources/envs/envs.js";
import {ref} from "./ref.js";
import {integer} from "./integer.js";
import {intersection} from "./intersection.js";

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
      beforeRefSchema: {
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

  it('should be able to create a json schema with ref', function () {
    // Given
    // When
    const schema = intersection([
      object({
        foo: ref({
          sourceName: 'envs',
          refToSourceParams: r => ({key: r}),
          schema: integer()
        })
      }),
      object({ bar: string() }),
    ])

    // Then
    expect(schema).toEqual(expect.objectContaining({
      beforeRefSchema: {
        type: 'object',
        allOf: [
          {
            type: 'object',
            properties: {
              foo: {
                type: 'string'
              }
            },
            required: ['foo'],
            additionalProperties: false,
          },
          {
            type: 'object',
            properties: {
              bar: {
                type: 'string'
              }
            },
            required: ['bar'],
            additionalProperties: false,
          }
        ]
      },
      afterRefSchema: {
        type: 'object',
        allOf: [
          {
            type: 'object',
            properties: {
              foo: {
                type: 'integer'
              }
            },
            required: ['foo'],
            additionalProperties: false,
          },
          {
            type: 'object',
            properties: {
              bar: {
                type: 'string'
              }
            },
            required: ['bar'],
            additionalProperties: false,
          }
        ]
      }
    }))
  })
})