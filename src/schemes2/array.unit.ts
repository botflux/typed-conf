import {describe, it} from "node:test";
import {string} from "./string.js";
import {expect} from "expect";
import {kType} from "./base.js";
import {expectTypeOf} from "expect-type";
import {array} from "./array.js";
import {boolean} from "./boolean.js";

describe('array', function () {
  it('should be able to declare an array', function () {
    // Given
    // When
    const schema = array({ item: string() })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      type: 'array',
      beforeRefSchema: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    }))
  })

  it('should have no aliases by default', function () {
    // Given
    // When
    const schema = array({ item: string() })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: []
    }))
  })

  it('should be typed correctly', function () {
    // Given
    // When
    const schema = array({ item: string() })

    // Then
    expectTypeOf(schema[kType]).toEqualTypeOf<string[]>()
  })

  it('should have no min length by default', function () {
    // Given
    // When
    const schema = array({ item: string() })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      beforeRefSchema: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    }))
  })

  it('should be able to declare a min length', function () {
    // Given
    // When
    const schema = array({ item: string(), minItems: 10 })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      beforeRefSchema: {
        type: 'array',
        items: {
          type: 'string',
        },
        minItems: 10
      },
    }))
  })

  it('should have no max length by default', function () {
    // Given
    // When
    const schema = array({ item: string() })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      beforeRefSchema: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    }))
  })

  it('should be able to declare a max length', function () {
    // Given
    // When
    const schema = array({
      item: string(),
      maxItems: 10
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      beforeRefSchema: {
        type: 'array',
        items: {
          type: 'string',
        },
        maxItems: 10
      },
    }))
  })

  describe('coercion', function () {
    it('should be able to coerce all the nested items', function () {
      // Given
      const schema = array({ item: boolean() })

      // When
      const result = schema.coerce([ 'true', 'false' ])

      // Then
      expect(result).toEqual([ true, false ])
    })

    it('should be able to ignore any value that is not an array', function () {
      // Given
      const schema = array({ item: string() })

      // When
      const result = schema.coerce({ foo: 'bar' })

      // Then
      expect(result).toEqual({ foo: 'bar' })
    })
  })
})