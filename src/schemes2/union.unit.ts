import {describe, it} from "node:test";
import {string} from "./string.js";
import {integer} from "./integer.js";
import {expect} from "expect";
import {envAlias} from "../sources/envs/envs.js";
import {union} from "./union.js";
import {expectTypeOf} from "expect-type";
import {kType} from "./base.js";

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
      schema: {
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
})