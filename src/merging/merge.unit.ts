import {describe, it} from "node:test";
import {expect} from "expect";

export const kOrigin = Symbol('origin')

export function localMerge (a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> {
  for (const key in b) {
    if (!(key in a) || a[key] === undefined) {
      a[key] = b[key]
    }

    if (typeof a[key] === 'object' && typeof b[key] === 'object' && !Array.isArray(a[key]) && !Array.isArray(b[key])) {
      localMerge(a[key] as Record<string, unknown>, b[key] as Record<string, unknown>)
    }

    if (Array.isArray(a[key]) && Array.isArray(b[key])) {
      a[key] = [...a[key], ...b[key]]
    }
  }

  if (kOrigin in a && kOrigin in b) {
    localMerge(a[kOrigin] as Record<string, unknown>, b[kOrigin] as Record<string, unknown>)
  }

  return a
}

describe('merge', function () {
  it('should be able to merge two objects', function () {
    // Given
    // When
    const result = localMerge({ foo: 'bar' }, { baz: 'qux' })

    // Then
    expect(result).toEqual({
      foo: 'bar',
      baz: 'qux'
    })
  })

  it('should not be able to override existing properties', function () {
    // Given
    // When
    const result = localMerge({ foo: 'bar' }, { foo: 'baz' })

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
    const result = localMerge(a, b)

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
    const result = localMerge(a, b)

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
    const result = localMerge(a, b)

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
    const result = localMerge(a, b)

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
    const result = localMerge(a, b)

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
    localMerge(a, b)

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
      const result = localMerge({ foo: 'bar', [kOrigin]: { foo: 'envs' } }, { baz: 'qux', [kOrigin]: { baz: 'cli' } })

      // Then
      expect(result[kOrigin as unknown as string]).toEqual({ foo: 'envs', baz: 'cli' })
    })

    it('should be able to override existing properties', function () {
      // Given
      // When
      const result = localMerge({ foo: 'bar', [kOrigin]: { foo: 'envs' } }, { foo: 'qux', [kOrigin]: { foo: 'cli' } })

      // Then
      expect(result[kOrigin as unknown as string]).toEqual({ foo: 'envs' })
    })

    it('should be able to merge arrays', function () {
      // Given
      const a = { foo: ['bar'], [kOrigin]: { foo: ['envs'] } }
      const b = { foo: ['baz'], [kOrigin]: { foo: ['cli'] } }

      // When
      const result = localMerge(a, b)

      // Then
      expect(result[kOrigin as unknown as string]).toEqual({
        foo: ['envs', 'cli']
      })
    })
  })

  it('should be able to merge even if kOrigin is a non-enumerable property', function () {
    // Given
    // When
    const result = localMerge(
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