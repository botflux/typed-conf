import {describe, it} from "node:test";
import {expect} from "expect";
import {string} from "./string.js";
import {expectTypeOf} from "expect-type";
import {envAlias} from "../sources/envs/envs.js";
import {kType} from "./base.js";

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

  it('should not have a min length by default', function () {
    // Given
    // When
    const schema = string()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      schema: {
        type: 'string',
      }
    }))
  })

  it('should be able to declare a min length', function () {
    // Given
    // When
    const schema = string().minLength(2)

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      schema: {
        type: 'string',
        minLength: 2
      }
    }))
  })

  describe('minLength method', function () {
    it('should be immutable', function () {
      // Given
      const schema = string()

      // When
      schema.minLength(2)

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        schema: {
          type: 'string',
        }
      }))
    })
  })

  it('should have no max length by default', function () {
    // Given
    // When
    const schema = string()

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      schema: {
        type: 'string',
      }
    }))
  })

  it('should be able to declare a max length', function () {
    // Given
    // When
    const schema = string().maxLength(10)

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      schema: {
        type: 'string',
        maxLength: 10
      }
    }))
  })

  describe('maxLength method', function () {
    it('should be immutable', function () {
      // Given
      const schema = string()

      // When
      schema.maxLength(10)

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        schema: {
          type: 'string',
        }
      }))
    })
  })
})