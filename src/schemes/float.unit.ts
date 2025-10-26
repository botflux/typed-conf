import {describe, it} from "node:test";
import {c} from "../loader/default-loader.js";
import {expect} from "expect";
import {envAlias} from "../sources/envs/envs.js";
import {AjvSchemaValidator} from "../validation/ajv.js";

describe('float', function () {
  it('should be able to declare a float', function () {
    // Given
    // When
    const schema = c.float()

    // Then
    expect(schema.schema.schema).toEqual({
      type: 'number'
    })
  })

  it('should be able to declare an optional float', function () {
    // Given
    // When
    const schema = c.float().optional()

    // Then
    expect(schema.schema.optional).toBe(true)
  })

  it('should be required by default', function () {
    // Given
    // When
    const schema = c.float()

    // Then
    expect(schema.schema.optional).toBe(false)
  })

  it('should be able to declare aliases', function () {
    // Given
    // When
    const schema = c.float().aliases(envAlias('FOO'))

    // Then
    expect(schema.schema.aliases).toEqual([envAlias('FOO')])
  })

  describe('coercion', function () {
    const cases = [
      [ 'foo', 'foo' ] as const,
      [ '1', 1 ] as const,
      [ '2.3', 2.3 ] as const,
      [ false, false ] as const
    ]

    for (const [ input, expected ] of cases) {
      it(`should be able to return ${expected} given ${input}`, function () {
        // Given
        const schema = c.float()

        // When
        const result = schema.schema.coerce?.(input)

        // Then
        expect(result).toBe(expected)
      })
    }
  })

  it('should be able to declare a secret float', function () {
    // Given
    // When
    const schema = c.float().secret()

    // Then
    expect(schema.schema.secret).toBe(true)
  })

  it('should not be a secret by default', function () {
    // Given
    // When
    const schema = c.float()

    // Then
    expect(schema.schema.secret).toBe(false)
  })

  describe('min/max', function () {
    const ajv = new AjvSchemaValidator()

    it('should be able to define a min', function () {
      // Given
      const schema = c.float().min(10)

      // When
      const throws = () => ajv.validate(schema.schema.schema, 5, 'foo')

      // Then
      expect(throws).toThrow(new Error("foo must be >= 10, got '5'"))
    })
  })
})