import {describe, it} from "node:test";
import {expect} from "expect";
import {expectTypeOf} from "expect-type";
import {kType} from "./base.js";
import {envAlias} from "../sources/envs/envs.js";
import {boolean} from "./boolean.js";

describe('boolean', function () {
  it('should be able to declare a boolean', function () {
    // Given
    // When
    const schema = boolean()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      schema: {
        type: 'boolean'
      }
    }))
  })

  it('should be required by default', function () {
    // Given
    // When
    const schema = boolean()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      optional: false
    }))
  })

  it('should have no aliases by default', function () {
    // Given
    // When
    const schema = boolean()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      aliases: []
    }))
  })

  it('should be a clear text value by default', function () {
    // Given
    // When
    const schema = boolean()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      secret: false
    }))
  })

  it('should be a boolean type', function () {
    // Given
    // When
    const schema = boolean()

    // Then
    expectTypeOf(schema.plain[kType]).toEqualTypeOf<boolean>()
  })

  describe('optional method', function () {
    it('should be able to declare an optional boolean', function () {
      // Given
      // When
      const schema = boolean().optional()

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        optional: true
      }))
    })

    it('should be immutable', function () {
      // Given
      const schema = boolean()

      // When
      schema.optional()

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        optional: false
      }))
    })

    it('should be able to make the underlying type nullable', function () {
      // Given
      // When
      const optional = boolean().optional()

      // Then
      expectTypeOf(optional.plain[kType]).toEqualTypeOf<boolean | undefined>()
    })
  })

  describe('secret method', function () {
    it('should be able to declare a secret boolean', function () {
      // Given
      // When
      const schema = boolean().secret()

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        secret: true
      }))
    })

    it('should be immutable', function () {
      // Given
      const schema = boolean()

      // When
      schema.secret()

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        secret: false
      }))
    })
  })

  describe('aliases method', function () {
    it('should be able to declare an  alias', function () {
      // Given
      // When
      const schema = boolean().aliases(envAlias('FOO'))

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        aliases: [envAlias('FOO')]
      }))
    })

    it('should be able to declare multiple aliases', function () {
      // Given
      // When
      const schema = boolean().aliases(envAlias('FOO'), envAlias('BAR'))

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        aliases: [envAlias('FOO'), envAlias('BAR')]
      }))
    })

    it('should be immutable', function () {
      // Given
      const schema = boolean()

      // When
      schema.aliases(envAlias('FOO'))

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        aliases: []
      }))
    })

    it('should be able to append aliases', function () {
      // Given
      // When
      const schema = boolean().aliases(envAlias('FOO')).aliases(envAlias('BAR'))

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        aliases: [envAlias('FOO'), envAlias('BAR')]
      }))
    })
  })
})