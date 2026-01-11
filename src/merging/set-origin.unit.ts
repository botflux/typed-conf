import {describe, it} from "node:test";
import {expect} from "expect";
import {getOrigin, setOrigin} from "./origin-utils.js";
import {kOrigin} from "./merge.js";

describe('setOrigin', function () {
  it('should be able to attach origin metadata to an object', function () {
    // Given
    const obj = { foo: 'bar' }

    // When
    setOrigin(obj, 'envs')

    // Then
    expect(getOrigin(obj)).toEqual({ foo: 'envs' })
  })

  it('should be able to attach origin metadata to nested object', function () {
    // Given
    const obj = { foo: { bar: 'baz' }, msg: 'hello world' }

    // When
    setOrigin(obj, 'envs')

    // Then
    expect(getOrigin(obj)).toEqual({ msg: 'envs' })
    expect(getOrigin(obj.foo)).toEqual({ bar: 'envs' })
  })

  it('should be able to attach origin metadata to array items', function () {
    // Given
    const obj = { foo: [ 1, 2 ] }

    // When
    setOrigin(obj, 'envs')

    // Then
    expect(getOrigin(obj)).toEqual({ foo: ['envs', 'envs'] })
  })

  it('should be able to attach metadata once', function () {
    // Given
    const obj = { foo: 1 }

    // When
    setOrigin(obj, 'envs')
    setOrigin(obj, 'envs')

    // Then
    expect(obj).toEqual({
      foo: 1,
      [kOrigin]: { foo: 'envs' }
    })
  })

  it('should be able to attach metadata with property name', function () {
    // Given
    const obj = { foo: 1 }

    // When
    setOrigin(obj, 'config.json', true)

    // Then
    expect(obj).toEqual({
      foo: 1,
      [kOrigin]: { 'foo': 'foo (config.json)' }
    })
  })
})