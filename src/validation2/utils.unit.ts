import {describe, it} from 'node:test'
import {object} from "../schemes/object.js";
import {string} from "../schemes/string.js";
import {expect} from "expect";
import {inlineCatchSync} from "../utils.js";
import {AjvValidator} from './validator.js'
import {kOrigin} from "../merging/merge.js";
import {expectTypeOf} from "expect-type";
import {getTypeSafeValueAtPathFactory} from "./utils.js";

describe('utils', () => {
  const getTypeSafeValueAtPath = getTypeSafeValueAtPathFactory(new AjvValidator())

  it('should be able to get a field', function () {
    // Given
    const schema = object({ bar: string() })
    const obj = { foo: { bar: 'baz' } }

    // When
    const value = getTypeSafeValueAtPath(obj, [ 'foo' ], schema)

    // Then
    expect(value).toEqual({ bar: 'baz' })
  })

  it('should be able to validate the value against the schema', {only: true}, function () {
    // Given
    const schema = object({ bar: string() })
    const obj = { foo: { bar: 123, [kOrigin]: { bar: 'envs:BAR' } } }

    // When
    const [result, error] = inlineCatchSync(() => getTypeSafeValueAtPath(obj, [ 'foo' ], schema))

    // Then
    expect(result).toBeUndefined()
    expect((error as Record<string, unknown>).message).toEqual('config validation failed')
    expect((error as Record<string, unknown>).errors).toEqual([
      new Error('envs:BAR must be string')
    ])
  })

  it('should be able to type the return type correctly', function () {
    // Given
    const schema = object({ bar: string() })
    const obj = { foo: { bar: 'baz' } }

    // When
    const value = getTypeSafeValueAtPath(obj, [ 'foo' ], schema)

    // Then
    expectTypeOf(value).toEqualTypeOf<{ bar: string }>()
  })
})