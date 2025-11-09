import {describe, it} from "node:test";
import {expect} from "expect";
import {string, kType} from "./string.js";
import {expectTypeOf} from "expect-type";
import {envAlias} from "../sources/envs/envs.js";

describe('strings', function () {
  it('should be able to create a string schema', function () {
    // Given
    // When
    const schema = string()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      type: 'string',
      schema: {
        type: 'string'
      },
    }))
  })

  it('should be able to create required string by default', function () {
    // Given
    // When
    const schema = string()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      optional: false
    }))
    expectTypeOf(schema.plain[kType]).toEqualTypeOf<string>()
  })

  it('should be able to create a string without alias by default', function () {
    // Given
    // When
    const schema = string()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      aliases: []
    }))
  })

  it('should be able to declare aliases', function () {
    // Given
    // When
    const schema = string().aliases(envAlias('FOO'))

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      aliases: [envAlias('FOO')]
    }))
  })

  describe('aliases method', function () {
    it('should be immutable', function () {
      // Given
      const schema = string()

      // When
      schema.aliases(envAlias('FOO'))

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        aliases: []
      }))
    })
  })

  it('should be able to make a string optional', function () {
    // Given
    const schema = string()

    // When
    const optional = schema.optional()

    // Then
    expect(optional.plain).toEqual(expect.objectContaining({
      optional: true
    }))
    expectTypeOf(optional.plain[kType]).toEqualTypeOf<string | undefined>()
  })

  describe('optional method', function () {
    it('should be immutable', function () {
      // Given
      const schema = string()

      // When
      schema.optional()

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        optional: false
      }))
    })
  })

  it('should not be a secret by default', function () {
    // Given
    // When
    const schema = string()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      secret: false
    }))
  })

  it('should be able to declare a string as secret', function () {
    // Given
    // When
    const schema = string().secret()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      secret: true
    }))
  })

  describe('secret method', function () {
    it('should be immutable', function () {
      // Given
      const schema = string()

      // When
      schema.secret()

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        secret: false
      }))
    })
  })
})