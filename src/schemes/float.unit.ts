import {describe, it} from "node:test";
import {expect} from "expect";
import {expectTypeOf} from "expect-type";
import {kType} from "./base.js";
import {float} from "./float.js";
import { envAlias } from "../sources/env/alias.js";
import { Number } from 'typebox'

describe('float', function () {
  it('should be able to declare a float', function () {
    // Given
    // When
    const schema = float()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      jsonSchema: {
        type: 'number'
      }
    }))
  })

  it('should have a validation schema', function () {
    // Given
    // When
    const schema = float()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      validationSchema: Number()
    }))
  })

  it('should be typed as a number by default', function () {
    // Given
    // When
    const schema = float()

    // Then
    expectTypeOf(schema[kType]).toEqualTypeOf<number>()
  })

  it('should have to aliases by default', function () {
    // Given
    // When
    const schema = float()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: []
    }))
  })

  describe('aliases method', function () {
    it('should be able to declare an alias', function () {
      // Given
      // When
      const schema = float({
        aliases: [envAlias('FOO')]
      })

      // Then
      expect(schema).toEqual(expect.objectContaining({
        aliases: [envAlias('FOO')]
      }))
    })

    it('should be able to declare multiple aliases', function () {
      // Given
      // When
      const schema = float({
        aliases: [ envAlias('FOO'), envAlias('BAR') ],
      })

      // Then
      expect(schema).toEqual(expect.objectContaining({
        aliases: [envAlias('FOO'), envAlias('BAR')]
      }))
    })
  })

  it('should have no min by default', function () {
    // Given
    // When
    const schema = float()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      jsonSchema: {
        type: 'number',
      }
    }))
  })

  describe('min', function () {
    it('should be able to declare a min', function () {
      // Given
      // When
      const schema = float({ min: 10 })

      // Then
      expect(schema).toEqual(expect.objectContaining({
        jsonSchema: {
          type: 'number',
          minimum: 10
        },
        validationSchema: Number({ minimum: 10 })
      }))
    })
  })

  it('should have no max by default', function () {
    // Given
    // When
    const schema = float()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      jsonSchema: {
        type: 'number',
      }
    }))

    it('should be able to throw if min is above the current max', function () {
      // Given
      // When
      const throws = () => float({ max: 10, min: 20 })

      // Then
      expect(throws).toThrow(new Error('min must be <= max, got min 20 and max 10'))
    })
  })

  describe('max', function () {
    it('should be able to declare a max', function () {
      // Given
      // When
      const schema = float({ max: 10 })

      // Then
      expect(schema).toEqual(expect.objectContaining({
        jsonSchema: {
          type: 'number',
          maximum: 10
        },
        validationSchema: Number({ maximum: 10 })
      }))
    })
  })

  describe('coercion', function () {
    it('should be able to coerce a string', function () {
      // Given
      // When
      const result = float().coerce('200')

      // Then
      expect(result).toEqual(200)
    })

    it('should be able to ignore non-number strings', function () {
      // Given
      // When
      const result = float().coerce('foo')

      // Then
      expect(result).toEqual('foo')
    })

    it('should be able to ignore anything that is not a string', function () {
      // Given
      // When
      const result = float().coerce({ bar: 'baz' })

      // Then
      expect(result).toEqual({ bar: 'baz' })
    })

    it('should be able to parse string holding a float', function () {
      // Given
      // When
      const result = float().coerce('12.34')

      // Then
      expect(result).toEqual(12.34)
    })
  })

  it('should be able to mark as deprecated', function () {
    // Given
    // When
    const schema = float({
      deprecated: true
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      deprecated: true,
      jsonSchema: expect.objectContaining({ deprecated: true }),
    }))
  })

  it('should not be deprecated by default', function () {
    // Given
    // When
    const schema = float()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      deprecated: false,
    }))
  })
})

