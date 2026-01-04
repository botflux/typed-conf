import {describe, it} from "node:test";
import {string} from "./string.js";
import {expect} from "expect";
import {kType} from "./base.js";
import {expectTypeOf} from "expect-type";
import {optional} from "./optional.js";
import {boolean} from "./boolean.js";
import {Integer, Optional} from "typebox";
import {integer} from "./integer.js";

describe('optional', function () {
  it('should be able to declare an optional type', function () {
    // Given
    // When
    const schema = optional(string())

    // Then
    expect(schema).toEqual(expect.objectContaining({
      type: 'optional',
      inner: string()
    }))
  })

  it('should be able to build the validation schema', function () {
    // Given
    // When
    const schema = optional(integer())

    // Then
    expect(schema.validationSchema).toEqual(Optional(Integer()))
  })

  it('should make the underlying schema type nullable', function () {
    // Given
    // When
    const schema = optional(string())

    // Then
    expectTypeOf(schema[kType]).toEqualTypeOf<string | undefined>()
  })

  describe('coercion', function () {
    it('should be able to coerce the value using the underlying schema\'s coercion function', function () {
      // Given
      const schema = optional(boolean())

      // When
      const value = schema.coerce?.('true')

      // Then
      expect(value).toEqual(true)
    })

    it('should be able to not call the underling schema\'s coercion function given the value is undefined', function () {
      // Given
      const schema = optional(boolean())

      // When
      const value = schema.coerce?.(undefined)

      // Then
      expect(value).toEqual(undefined)
    })
  })
})