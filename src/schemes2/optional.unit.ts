import {describe, it} from "node:test";
import {string} from "./string.js";
import {expect} from "expect";
import {kType} from "./base.js";
import {expectTypeOf} from "expect-type";
import {optional} from "./optional.js";

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

  it('should make the underlying schema type nullable', function () {
    // Given
    // When
    const schema = optional(string())

    // Then
    expectTypeOf(schema[kType]).toEqualTypeOf<string | undefined>()
  })
})