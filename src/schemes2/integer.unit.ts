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
    expect(schema.plain).toEqual(expect.objectContaining({
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
    expectTypeOf(schema.plain[kType]).toEqualTypeOf<number>()
  })

  it('should have no aliases by default', function () {
    // Given
    // When
    const schema = integer()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      aliases: []
    }))
  })

  describe('aliases method', function () {
    it('should be able to declare an alias', function () {
      // Given
      // When
      const schema = integer().aliases(envAlias('FOO'))

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        aliases: [envAlias('FOO')]
      }))
    })

    it('should be able to declare multiple aliases', function () {
      // Given
      // When
      const schema = integer().aliases(envAlias('FOO'), envAlias('BAR'))

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        aliases: [envAlias('FOO'), envAlias('BAR')]
      }))
    })

    it('should be able to append aliases', function () {
      // Given
      const schema = integer().aliases(envAlias('FOO'))

      // When
      const schema2 = schema.aliases(envAlias('BAR'))

      // Then
      expect(schema2.plain).toEqual(expect.objectContaining({
        aliases: [envAlias('FOO'), envAlias('BAR')]
      }))
    })

    it('should be immutable', function () {
      // Given
      const schema = integer()

      // When
      schema.aliases(envAlias('FOO'))

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        aliases: []
      }))
    })
  })

  it('should have no minimum by default', function () {
    // Given
    // When
    const schema = integer()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      schema: {
        type: 'integer',
      }
    }))
  })

  describe('min method', function () {
    it('should be able to declare a minimum', function () {
      // Given
      // When
      const schema = integer().min(10)

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        schema: {
          type: 'integer',
          minimum: 10
        }
      }))
    })

    it('should be able immutable', function () {
      // Given
      const schema = integer()

      // When
      schema.min(10)

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        schema: {
          type: 'integer',
        }
      }))
    })

    it('should be able to throw given min is above the current max', function () {
      // Given
      const schema = integer().max(10)

      // When
      const throws = () => schema.min(20)

      // Then
      expect(throws).toThrow(new Error('min must be <= max, got 20'))
    })
  })

  describe('max method', function () {
    it('should be able to declare a max', function () {
      // Given
      // When
      const schema = integer().max(10)

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        schema: {
          type: 'integer',
          maximum: 10
        }
      }))
    })

    it('should be immutable', function () {
      // Given
      const schema = integer()

      // When
      schema.max(10)

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        schema: {
          type: 'integer',
        }
      }))
    })

    it('should be able to throw given max is below the current min', function () {
      // Given
      const schema = integer().min(10)

      // When
      const throws = () => schema.max(5)

      // Then
      expect(throws).toThrow(new Error('max must be >= min, got 5'))
    })
  })
})