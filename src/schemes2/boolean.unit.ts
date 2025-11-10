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

  it('should have no aliases by default', function () {
    // Given
    // When
    const schema = boolean()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      aliases: []
    }))
  })

  it('should be a boolean type', function () {
    // Given
    // When
    const schema = boolean()

    // Then
    expectTypeOf(schema.plain[kType]).toEqualTypeOf<boolean>()
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