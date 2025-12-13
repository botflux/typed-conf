import {describe, it} from "node:test";
import {expect} from "expect";
import {kType} from "./base.js";
import {expectTypeOf} from "expect-type";
import {any} from "./any.js";

describe('any', function () {
  it('should be able to declare a any schema', function () {
    // Given
    // When
    const schema = any()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      type: 'any',
      jsonSchema: {},
    }))
  })

  it('should be able to type the schema as any by default', function () {
    // Given
    // When
    const schema = any()

    // Then
    expectTypeOf(schema[kType]).toEqualTypeOf<any>()
  })

  it('should be able to override the type', function () {
    // Given
    // When
    const schema = any<Buffer>()

    // Then
    expectTypeOf(schema[kType]).toEqualTypeOf<Buffer>()
  })

  it('should be able to mark as deprecated', function () {
    // Given
    // When
    const schema = any({
      deprecated: true
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
    const schema = any()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      deprecated: false,
    }))
  })
})