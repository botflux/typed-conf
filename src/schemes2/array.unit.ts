import {describe, it} from "node:test";
import {string} from "./string.js";
import {expect} from "expect";
import {kType} from "./base.js";
import {expectTypeOf} from "expect-type";
import {array} from "./array.js";

describe('array', function () {
  it('should be able to declare an array', function () {
    // Given
    // When
    const schema = array({ item: string() })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      type: 'array',
      schema: {
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
      schema: {
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
      schema: {
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
      schema: {
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
      schema: {
        type: 'array',
        items: {
          type: 'string',
        },
        maxItems: 10
      },
    }))
  })
})