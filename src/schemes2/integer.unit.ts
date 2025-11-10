import {describe, it} from "node:test";
import {expect} from "expect";
import {kType} from "./base.js";
import {expectTypeOf} from "expect-type";
import {envAlias} from "../sources/envs/envs.js";
import {integer} from "./integer.js";

describe('integer', function () {
  it('should be able to declare an integer', function () {
    // Given
    // When
    const schema = integer()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      schema: {
        type: 'integer'
      }
    }))
  })

  it('should be able to type the schema as number', function () {
    // Given
    // When
    const schema = integer()

    // Then
    expectTypeOf(schema[kType]).toEqualTypeOf<number>()
  })

  it('should have no aliases by default', function () {
    // Given
    // When
    const schema = integer()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: []
    }))
  })

  it('should be able to declare an alias', function () {
    // Given
    // When
    const schema = integer({
      aliases: [envAlias('FOO')
      ]
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: [envAlias('FOO')]
    }))
  })

  it('should be able to declare multiple aliases', function () {
    // Given
    // When
    const schema = integer({
      aliases: [envAlias('FOO'), envAlias('BAR')]
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: [envAlias('FOO'), envAlias('BAR')]
    }))
  })

  it('should have no minimum by default', function () {
    // Given
    // When
    const schema = integer()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      schema: {
        type: 'integer',
      }
    }))
  })

  it('should be able to declare a minimum', function () {
    // Given
    // When
    const schema = integer({min: 10})

    // Then
    expect(schema).toEqual(expect.objectContaining({
      schema: {
        type: 'integer',
        minimum: 10
      }
    }))
  })

  it('should be able to throw given min is above the current max', function () {
    // Given

    // When
    const throws = () => integer({max: 10, min: 20})

    // Then
    expect(throws).toThrow(new Error('min must be <= max, got min 20 and max 10'))
  })

  it('should be able to declare a max', function () {
    // Given
    // When
    const schema = integer({max: 10})

    // Then
    expect(schema).toEqual(expect.objectContaining({
      schema: {
        type: 'integer',
        maximum: 10
      }
    }))
  })
})