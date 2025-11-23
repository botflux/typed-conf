import {describe, it} from "node:test";
import {string} from "./string.js";
import {integer} from "./integer.js";
import {expect} from "expect";
import {envAlias} from "../sources/envs/envs.js";
import {union} from "./union.js";
import {expectTypeOf} from "expect-type";
import {kType} from "./base.js";
import {boolean} from "./boolean.js";

describe('union', function () {
  it('should be able to declare an union', function () {
    // Given
    // When
    const schema = union([
      string(),
      integer(),
    ])

    // Then
    expect(schema).toEqual(expect.objectContaining({
      type: 'union',
      schemes: [
        string(),
        integer(),
      ],
      jsonSchema: {
        type: 'object',
        oneOf: [
          {
            type: 'string',
          },
          {
            type: 'integer'
          }
        ]
      }
    }))
  })

  it('should have no aliases by default', function () {
    // Given

    // When
    const schema = union([ integer(), string() ])

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: []
    }))
  })

  it('should be able to declare an alias', function () {
    // Given
    // When
    const schema = union([ string(), integer() ], {
      aliases: [ envAlias('FOO') ]
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: [envAlias('FOO')]
    }))
  })

  it('should be typed correctly', function () {
    // Given
    // When
    const schema = union([ string(), integer() ])

    // Then
    expectTypeOf(schema[kType]).toEqualTypeOf<string | number>()
  })

  describe('coercion', function () {
    it('should be able to coerce using the underlying schema\'s coercion function', function () {
      // Given
      const schema = union([ boolean() ])

      // When
      const result = schema.coerce?.('true')

      // Then
      expect(result).toEqual(true)
    })

    it('should be able to apply the underlying schemes\' coercion function until one of function changes the value', function () {
      // Given
      const schema = union([ string(), integer() ])

      // When
      const result = schema.coerce?.('12')

      // Then
      expect(result).toEqual(12)
    })

    it('should be able to return the value if none of the underlying schemes\' coercion function has changed the value', function () {
      // Given
      const schema = union([ string(), integer() ])

      // When
      const result = schema.coerce?.({ foo: 'bar' })

      // Then
      expect(result).toEqual({ foo: 'bar' })
    })
  })
})