import {describe, it} from "node:test";
import {c} from "../loader/default-loader.js";
import {expect} from "expect";
import {envAlias} from "../sources/envs/envs.js";
import {AjvSchemaValidator} from "../validation/ajv.js";
import {string} from "./string.js";

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

  describe('minLength/maxLength', function () {
    const ajv = new AjvSchemaValidator()

    it('should be able to declare a min length', function () {
      // Given
      const schema = string().minLength(3)

      // When
      const throws = () => ajv.validate(schema.schema.schema, "f", "foo")

      // Then
      expect(throws).toThrow(new Error("foo must NOT have fewer than 3 characters, got 'f'"))
    })

    it('should be able to declare a max length', function () {
      // Given
      const schema = string().maxLength(4)

      // When
      const throws = () => ajv.validate(schema.schema.schema, "foobar", "foo")

      // Then
      expect(throws).toThrow(new Error("foo must NOT have more than 4 characters, got 'foobar'"))
    })
  })
})