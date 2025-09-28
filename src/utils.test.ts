import {describe, it} from "node:test";
import {getValueAtPath} from "./utils.js";
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
    expect(() => getValueAtPath(o, ["foo", "bar"])).toThrow(new Error("Cannot get value at path 'foo.bar' because the intermediate value (foo) is not an object"))
  })
})