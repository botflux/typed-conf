import {describe, it} from "node:test";
import {expect} from "expect";
import {kType} from "./base.js";
import {expectTypeOf} from "expect-type";
import {integer} from "./integer.js";
import { envAlias } from "../sources/env/alias.js";
import {Integer} from "@sinclair/typebox";

describe('integer', function () {
  it('should be able to declare an integer', function () {
    // Given
    // When
    const schema = integer()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      jsonSchema: {
        type: 'integer'
      }
    }))
  })

  it('should have a validation schema', function () {
    // Given
    // When
    const schema = integer()

    // Then
    expect(schema.validationSchema).toEqual(Integer())
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
      jsonSchema: {
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
      jsonSchema: {
        type: 'integer',
        minimum: 10
      },
      validationSchema: Integer({minimum: 10})
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
      jsonSchema: {
        type: 'integer',
        maximum: 10
      },
      validationSchema: Integer({maximum: 10})
    }))
  })

  describe('coercion', function () {
    it('should be able to coerce a string', function () {
      // Given
      // When
      const result = integer().coerce('200')

      // Then
      expect(result).toEqual(200)
    })

    it('should be able to ignore non-number strings', function () {
      // Given
      // When
      const result = integer().coerce('foo')

      // Then
      expect(result).toEqual('foo')
    })

    it('should be able to ignore anything that is not a string', function () {
      // Given
      // When
      const result = integer().coerce({ bar: 'baz' })

      // Then
      expect(result).toEqual({ bar: 'baz' })
    })

    // `integer().coerce() parses float correctly and not only integer.
    // I think that it is the job of validation to throw an error because the
    // number is not an integer.
    it('should be able to parse string holding a float', function () {
      // Given
      // When
      const result = integer().coerce('12.34')

      // Then
      expect(result).toEqual(12.34)
    })
  })

  it('should be able to mark as deprecated', function () {
    // Given
    // When
    const schema = integer({ deprecated: true })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      deprecated: true,
      jsonSchema: expect.objectContaining({ deprecated: true }),
    }))
  })

  it('should not be deprecated by default', function () {
    // Given
    // When
    const schema = integer()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      deprecated: false,
    }))
  })

  it('should not be deprecated by default', function () {
    // Given
    // When
    const schema = integer()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      deprecated: false,
    }))
  })
})