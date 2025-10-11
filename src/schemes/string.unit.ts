import {describe, it} from "node:test";
import {c} from "../loader.js";
import {expect} from "expect";
import {envAlias} from "../sources/envs.js";

describe('string', function () {
  it('should be able to declare a string schema', function () {
    // Given
    // When
    const schema = c.string()

    // Then
    expect(schema.schema.schema).toEqual({
      type: 'string',
    })
  })

  it('should be able to declare an optional string', function () {
    // Given
    // When
    const schema = c.string().optional()

    // Then
    expect(schema.schema.optional).toBe(true)
  })

  it('should be required by default', function () {
    // Given
    // When
    const schema = c.string()

    // Then
    expect(schema.schema.optional).toBe(false)
  })

  it('should be able to declare aliases', function () {
    // Given
    // When
    const schema = c.string().aliases(envAlias('FOO'))

    // Then
    expect(schema.schema.aliases).toEqual([ envAlias('FOO') ])
  })

  it('should be able to declare a string as a secret', function () {
    // Given
    // When
    const schema = c.string().secret()

    // Then
    expect(schema.schema.secret).toBe(true)
  })

  it('should not be a secret by default', function () {
    // Given
    // When
    const schema = c.string()

    // Then
    expect(schema.schema.secret).toBe(false)
  })
})