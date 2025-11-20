import {describe, it} from "node:test";
import {expect} from "expect";
import {kOrigin, merge} from "./merge.js";

describe('merge', function () {
  it('should be able to merge two objects', function () {
    // Given
    // When
    const result = merge({ foo: 'bar' }, { baz: 'qux' })

    // Then
    expect(result).toEqual({
      foo: 'bar',
      baz: 'qux'
    })
  })

  it('should not be able to override existing properties', function () {
    // Given
    // When
    const result = merge({ foo: 'bar' }, { foo: 'baz' })

    // Then
    expect(result).toEqual({
      foo: 'bar'
    })
  })

  it('should be able to merge nested objects', function () {
    // Given
    const a = { foo: { bar: 'baz' } }
    const b = { foo: { qux: 'quux' } }

    // When
    const result = merge(a, b)

    // Then
    expect(result).toEqual({
      foo: {
        bar: 'baz',
        qux: 'quux'
      }
    })
  })

  it('should be able to take the first object\'s value in case of a type mismatch', function () {
    // Given
    const a = { foo: 'bar' }
    const b = { foo: { msg: "hello world" } }

    // When
    const result = merge(a, b)

    // Then
    expect(result).toEqual({
      foo: 'bar'
    })
  })

  it('should be able to merge arrays', function () {
    // Given
    const a = { foo: ['bar'] }
    const b = { foo: ['baz'] }

    // When
    const result = merge(a, b)

    // Then
    expect(result).toEqual({
      foo: ['bar', 'baz']
    })
  })

  it('should be able to merge array of objects, but not the underlying objects themselves', function () {
    // Given
    const a = { foo: [{ bar: 'baz' }] }
    const b = { foo: [{ qux: 'quux' }] }

    // When
    const result = merge(a, b)

    // Then
    expect(result).toEqual({
      foo: [{ bar: 'baz' }, { qux: 'quux' }]
    })
  })

  it('should be able to override undefined', function () {
    // Given
    const a = { foo: undefined }
    const b = { foo: 'bar' }

    // When
    const result = merge(a, b)

    // Then
    expect(result).toEqual({
      foo: 'bar'
    })
  })

  it('should mutate the first object, but not the second', function () {
    // Given
    const a = { foo: 'bar' }
    const b = { baz: 'qux' }

    // When
    merge(a, b)

    // Then
    expect(a).toEqual({
      foo: 'bar',
      baz: 'qux'
    })
    expect(b).toEqual({ baz: 'qux' })
  })

  describe('custom origin symbol', function () {
    it('should be able to merge the origin symbol property', function () {
      // Given
      // When
      const result = merge({ foo: 'bar', [kOrigin]: { foo: 'envs' } }, { baz: 'qux', [kOrigin]: { baz: 'cli' } })

      // Then
      expect(result[kOrigin as unknown as string]).toEqual({ foo: 'envs', baz: 'cli' })
    })

    it('should be able to override existing properties', function () {
      // Given
      // When
      const result = merge({ foo: 'bar', [kOrigin]: { foo: 'envs' } }, { foo: 'qux', [kOrigin]: { foo: 'cli' } })

      // Then
      expect(result[kOrigin as unknown as string]).toEqual({ foo: 'envs' })
    })

    it('should be able to merge arrays', function () {
      // Given
      const a = { foo: ['bar'], [kOrigin]: { foo: ['envs'] } }
      const b = { foo: ['baz'], [kOrigin]: { foo: ['cli'] } }

      // When
      const result = merge(a, b)

      // Then
      expect(result[kOrigin as unknown as string]).toEqual({
        foo: ['envs', 'cli']
      })
    })
  })

  it('should be able to merge even if kOrigin is a non-enumerable property', function () {
    // Given
    // When
    const result = merge(
      Object.defineProperty({ foo: 'bar' }, kOrigin, {
        enumerable: false,
        value: { foo: 'envs' }
      }),
      Object.defineProperty({ baz: 'qux' }, kOrigin, {
        enumerable: false,
        value: { baz: 'cli' }
      })
    )

    // Then
    expect(result[kOrigin as unknown as string]).toEqual({ foo: 'envs', baz: 'cli' })
  })
})