import {describe, it} from "node:test";
import {expect} from "expect";
import {string} from "./string.js";
import {integer} from "./integer.js";
import { envAlias } from "../sources/env/alias.js";

describe('strings', function () {
  it('should be able to create a string schema', function () {
    // Given
    // When
    const schema = string()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      type: 'string',
      jsonSchema: {
        type: 'string'
      },
    }))
  })

  it('should be able to create a string without alias by default', function () {
    // Given
    // When
    const schema = string()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: []
    }))
  })

  it('should be able to declare aliases', function () {
    // Given
    // When
    const schema = string({
      aliases: [ envAlias('FOO') ]
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: [envAlias('FOO')]
    }))
  })

  it('should not have a min length by default', function () {
    // Given
    // When
    const schema = string()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      jsonSchema: {
        type: 'string',
      }
    }))
  })

  it('should be able to declare a min length', function () {
    // Given
    // When
    const schema = string({
      minLength: 2
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      jsonSchema: {
        type: 'string',
        minLength: 2
      }
    }))
  })

  it('should have no max length by default', function () {
    // Given
    // When
    const schema = string()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      jsonSchema: {
        type: 'string',
      }
    }))
  })

  it('should be able to declare a max length', function () {
    // Given
    // When
    const schema = string({
      maxLength: 10
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      jsonSchema: {
        type: 'string',
        maxLength: 10
      }
    }))
  })

  describe('coercion', function () {
    // there's nothing to do with strings
    it('should be able to do nothing', function () {
      // Given
      // When
      const schema = string().coerce?.('foo')

      // Then
      expect(schema).toEqual('foo')
    })
  })

  describe('mappings', function () {
    it('should be able to define a mapping', function () {
      // Given
      const map = (n: number) => n.toString()

      // When
      const schema = string({
        mapping: {
          baseSchema: integer(),
          map
        }
      })

      // Then
      expect(schema).toEqual(expect.objectContaining({
        mapping: expect.objectContaining({
          baseSchema: integer(),
          map
        })
      }))
    })
  })

  it('should be able to declare a default value', function () {
    // Given
    // When
    const schema = string({
      defaultValue: 'foo'
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      defaultValue: 'foo'
    }))
  })

  it('should be able to mark as deprecated', function () {
    // Given
    // When
    const schema = string({
      deprecated: true,
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
    const schema = string()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      deprecated: false,
    }))
  })
})