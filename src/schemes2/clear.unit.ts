import {describe, it} from "node:test";
import {string} from "./string.js";
import {expect} from "expect";
import {kType} from "./base.js";
import {expectTypeOf} from "expect-type";
import {clear} from "./clear.js";

describe('clear', function () {
  it('should be able to declare a clear text schema', function () {
    // Given
    // When
    const schema = clear(string())

    // Then
    expect(schema).toEqual(expect.objectContaining({
      type: 'clear',
      inner: string()
    }))
  })

  it('should use the underlying schema\'s type', function () {
    // Given
    // When
    const schema = clear(string())

    // Then
    expectTypeOf(schema[kType]).toEqualTypeOf<string>()
  })
})