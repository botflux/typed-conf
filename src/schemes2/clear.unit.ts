import {describe, it} from "node:test";
import {expect} from "expect";
import {kType} from "./base.js";
import {expectTypeOf} from "expect-type";
import {clear} from "./clear.js";
import {boolean} from "./boolean.js";
import {string} from "./string.js";
import {ref} from "./ref.js";

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

  it('should be able to create json schema for a ref', function () {
    // Given
    // When
    const schema = clear(ref({
      schema: boolean(),
      sourceName: 'envs',
      refToSourceParams: r => ({key: r}),
    }))

    // Then
    expect(schema).toEqual(expect.objectContaining({
      beforeRefSchema: {
        type: 'string'
      },
      afterRefSchema: {
        type: 'boolean'
      }
    }))
  })

  describe('coercion', function () {
    it('should be able to coerce using the underlying schema\'s coercion function', function () {
      // Given
      const schema = clear(boolean())

      // When
      const result = schema.coerce?.('true')

      // Then
      expect(result).toEqual(true)
    })
  })
})