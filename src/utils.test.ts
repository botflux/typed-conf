import {describe, it} from "node:test";
import {getValueAtPath, inlineCatchSync, setValueAtPath} from "./utils.js";
import {expect} from "expect";

describe('utils#getValueAtPath', function () {
  it('should be able to get the value of an object', function () {
    // Given
    const o = { key: "foo" }

    // When
    const value = getValueAtPath(o, ["key"])

    // Then
    expect(value).toBe("foo")
  })

  it('should be able to get the value of a nested object', function () {
    // Given
    const o = {
      foo: {
        bar: "hello"
      }
    }

    // When
    const value = getValueAtPath(o, ["foo", "bar"])

    // Then
    expect(value).toBe("hello")
  })

  it('should be able to throw if the path is empty', function () {
    // Given
    const o = {}

    // When
    // Then
    expect(() => getValueAtPath(o, [])).toThrow(new Error("Path must contain at least one element"))
  })

  it('should be able to return undefined if the intermediate objects does not exist', function () {
    // Given
    const o = {}

    // When
    const value = getValueAtPath(o, ["foo", "bar"])

    // Then
    expect(value).toBe(undefined)
  })

  it('should be able to return undefined if the final property is undefined', function () {
    // Given
    const o = {
      foo: {}
    }

    // When
    const value = getValueAtPath(o, ["foo", "bar"])

    // Then
    expect(value).toBe(undefined)
  })

  it('should be able to throw if a chunk of the path is not an object', function () {
    // Given
    const o = {
      foo: "bar"
    }

    // When
    // Then
    expect(() => getValueAtPath(o, ["foo", "bar"])).toThrow(new Error("Cannot get value at path 'foo.bar' because the intermediate property \"foo\" is not an object"))
  })
})

describe('utils#setValueAtPath', function () {
  it('should be able to set the value of a property', function () {
    // Given
    const o = {}

    // When
    setValueAtPath(o, ["key"], "foo")

    // Then
    expect(o).toEqual({key: "foo"})
  })

  it('should be able to set the value of a nested property', function () {
    // Given
    const o = {
      foo: {}
    }

    // When
    setValueAtPath(o, ["foo", "bar"], "foo")

    // Then
    expect(o).toEqual({ foo: { bar: "foo" } })
  })

  it('should be able to throw an error if the path is empty', function () {
    // Given
    const o = {}

    // When
    // Then
    expect(() => setValueAtPath(o, [], "foo")).toThrow(new Error("Path must contain at least one element"))
  })

  it('should be able to create intermediate objects if they are not existing', function () {
    // Given
    const o = {}

    // When
    setValueAtPath(o, ["foo", "bar"], "foo")

    // Then
    expect(o).toEqual({ foo: { bar: "foo" } })
  })

  it('should be able to throw an error if the intermediate properties are not objects', function () {
    // Given
    const o = {
      foo: "bar"
    }

    // When
    // Then
    expect(() => setValueAtPath(o, ["foo", "bar"], "foo")).toThrow(new Error("Cannot set value at path 'foo.bar' because the intermediate property \"foo\" is not an object"))
  })
})

describe('utils#inlineCatchSync', function () {
  it('should be able to return the value in a tuple', function () {
    // Given
    // When
    const result = inlineCatchSync(() => 'foo')

    // Then
    expect(result).toEqual([ 'foo', undefined ])
  })

  it('should be able to return the error as the second element of a tuple', function () {
    // Given
    const error = new Error('oops')

    // When
    const result = inlineCatchSync(() => {
      throw error
    })

    // Then
    expect(result).toEqual([ undefined, error ])
  })
})