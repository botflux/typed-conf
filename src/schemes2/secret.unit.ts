import {describe, it} from "node:test";
import {string} from "./string.js";
import {expect} from "expect";
import {kType} from "./base.js";
import {expectTypeOf} from "expect-type";
import {secret} from "./secret.js";
import {boolean} from "./boolean.js";

describe('secret', function () {
  it('should be able to mark a type as secret', function () {
    // Given
    // When
    const schema = secret(string())

    // Then
    expect(schema).toEqual(expect.objectContaining({
      type: 'secret',
      inner: string()
    }))
  })

  it('should use the underlying schema\'s type', function () {
    // Given
    // When
    const schema = secret(string())

    // Then
    expectTypeOf(schema[kType]).toEqualTypeOf<string>()
  })

  describe('coercion', function () {
    it('should be able to call the underlying schema\'s coercion function', function () {
      // Given
      const schema = secret(boolean())

      // When
      const result = schema.coerce?.('true')

      // Then
      expect(result).toEqual(true)
    })
  })
})