import {describe, it} from "node:test";
import {expect} from "expect";
import {expectTypeOf} from "expect-type";
import {kType} from "./base.js";
import {envAlias} from "../sources/envs/envs.js";
import {float} from "./float.js";

describe('float', function () {
  it('should be able to declare a float', function () {
    // Given
    // When
    const schema = float()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      schema: {
        type: 'number'
      }
    }))
  })

  it('should be typed as a number by default', function () {
    // Given
    // When
    const schema = float()

    // Then
    expectTypeOf(schema.plain[kType]).toEqualTypeOf<number>()
  })

  it('should be optional by default', function () {
    // Given
    // When
    const schema = float()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      optional: false
    }))
  })

  it('should have to aliases by default', function () {
    // Given
    // When
    const schema = float()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      aliases: []
    }))
  })

  it('should not be a secret by default', function () {
    // Given
    // When
    const schema = float()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      secret: false
    }))
  })

  describe('optional method', function () {
    it('should be able to declare an optional float', function () {
      // Given
      // When
      const schema = float().optional()

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        optional: true
      }))
    })

    it('should be immutable', function () {
      // Given
      const schema = float()

      // When
      schema.optional()

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        optional: false
      }))
    })

    it('should be able to change the underlying type', function () {
      // Given
      // When
      const optional = float().optional()

      // Then
      expectTypeOf(optional.plain[kType]).toEqualTypeOf<number | undefined>()
    })
  })

  describe('aliases method', function () {
    it('should be able to declare an alias', function () {
      // Given
      // When
      const schema = float().aliases(envAlias('FOO'))

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        aliases: [envAlias('FOO')]
      }))
    })

    it('should be able to declare multiple aliases', function () {
      // Given
      // When
      const schema = float().aliases(envAlias('FOO'), envAlias('BAR'))

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        aliases: [envAlias('FOO'), envAlias('BAR')]
      }))
    })

    it('should be immutable', function () {
      // Given
      const schema = float()

      // When
      schema.aliases(envAlias('FOO'))

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        aliases: []
      }))
    })

    it('should be able to append new aliases', function () {
      // Given
      const schema = float().aliases(envAlias('FOO'))

      // When
      const schema2 = schema.aliases(envAlias('BAR'))

      // Then
      expect(schema2.plain).toEqual(expect.objectContaining({
        aliases: [envAlias('FOO'), envAlias('BAR')]
      }))
    })
  })

  it('should have no min by default', function () {
    // Given
    // When
    const schema = float()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      schema: {
        type: 'number',
      }
    }))
  })

  describe('min', function () {
    it('should be able to declare a min', function () {
      // Given
      // When
      const schema = float().min(10)

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        schema: {
          type: 'number',
          minimum: 10
        }
      }))
    })

    it('should be immutable', function () {
      // Given
      const schema = float()

      // When
      schema.min(10)

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        schema: {
          type: 'number',
        }
      }))
    })
  })

  it('should have no max by default', function () {
    // Given
    // When
    const schema = float()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      schema: {
        type: 'number',
      }
    }))

    it('should be able to throw if min is above the current max', function () {
      // Given
      const schema = float().max(10)

      // When
      const throws = () => schema.min(20)

      // Then
      expect(throws).toThrow(new Error('min must be <= max, got 20'))
    })
  })

  describe('max', function () {
    it('should be able to declare a max', function () {
      // Given
      // When
      const schema = float().max(10)

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        schema: {
          type: 'number',
          maximum: 10
        }
      }))
    })

    it('should be immutable', function () {
      // Given
      const schema = float()

      // When
      schema.max(10)

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        schema: {
          type: 'number',
        }
      }))
    })

    it('should be able to throw if max is below the current min', function () {
      // Given
      const schema = float().min(10)

      // When
      const throws = () => schema.max(5)

      // Then
      expect(throws).toThrow(new Error('max must be >= min, got 5'))
    })
  })

  describe('secret method', function () {
    it('should be able to declare a secret', function () {
      // Given
      // When
      const schema = float().secret()

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        secret: true
      }))
    })

    it('should be immutable', function () {
      // Given
      const schema = float()

      // When
      schema.secret()

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        secret: false
      }))
    })
  })
})

