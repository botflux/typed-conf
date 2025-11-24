import {describe, it} from "node:test";
import {integer} from "./integer.js";
import {object} from "./object.js";
import {expect} from "expect";
import {getSchemaAtPath} from "./base.js";
import {string} from "./string.js";

describe('getSchemaAtPath', function () {
  it('should be able to get the schema at the given path', function () {
    // Given
    const schema = object({
      port: integer()
    })

    // When
    const result = getSchemaAtPath(schema, ['port'])

    // Then
    expect(result).toEqual(integer())
  })

  it('should be able to get a nested schema', function () {
    // Given
    const schema = object({
      port: string(),
      nested: object({
        foo: integer()
      })
    })

    // When
    const result = getSchemaAtPath(schema, ['nested', 'foo'])

    // Then
    expect(result).toEqual(integer())
  })

  it('should be able to return undefined given there is no schema for the property', function () {
    // Given
    const schema = object({})

    // When
    const result = getSchemaAtPath(schema, ['port'])

    // Then
    expect(result).toBeUndefined()
  })

  it('should be able to return the passed object given the path is empty', function () {
    // Given
    const schema = object({})

    // When
    const result = getSchemaAtPath(schema, [])

    // Then
    expect(result).toEqual(schema)
  })

  it('should be able to return undefined given an intermediary schema does not exist', function () {
    // Given
    const schema = object({
      port: integer()
    })

    // When
    const result = getSchemaAtPath(schema, ['foo', 'bar'])

    // Then
    expect(result).toBeUndefined()
  })

  it('should be able to throw given an intermediary schema is not an object schema', function () {
    // Given
    const schema = object({
      port: integer()
    })

    // When
    const throws = () => getSchemaAtPath(schema, ['port', 'foo'])

    // Then
    expect(throws).toThrow(new Error('Cannot get port.foo because port is not an object schema'))
  })
})
