import {describe, it} from "node:test";
import {c} from "../loader.js";
import {expect} from "expect";
import {envAlias} from "../sources/envs/envs.js";

describe('integer', function () {
  it('should be able to declare an integer', function () {
    // Given
    // When
    const schema = c.integer()

    // Then
    expect(schema.schema.schema).toEqual({
      type: 'integer'
    })
  })

  it('should be able to declare an optional integer', function () {
    // Given
    // When
    const schema = c.integer().optional()

    // Then
    expect(schema.schema.optional).toBe(true)
  })

  it('should be required by default', function () {
    // Given
    // When
    const schema = c.integer()

    // Then
    expect(schema.schema.optional).toBe(false)
  })

  it('should be able to declare aliases', function () {
    // Given
    // When
    const schema = c.integer().aliases(envAlias('FOO'))

    // Then
    expect(schema.schema.aliases).toEqual([envAlias('FOO')])
  })

  describe('coercion', function () {
    const cases = [
      [ 'foo', 'foo' ] as const,
      [ true, true ] as const,
      [ '45', 45 ] as const,
      [ '12.1', 12 ] as const,
    ]

    for (const [ input, expected ] of cases) {
      it(`should be able to return ${expected} given ${input}`, function () {
        // Given
        const schema = c.integer()

        // When
        const result = schema.schema.coerce?.(input)

        // Then
        expect(result).toBe(expected)
      })
    }
  })

  it('should be able to declare a secret integer', function () {
    // Given
    // When
    const schema = c.integer().secret()

    // Then
    expect(schema.schema.secret).toBe(true)
  })

  it('should not be a secret by default', function () {
    // Given
    // When
    const schema = c.integer()

    // Then
    expect(schema.schema.secret).toBe(false)
  })
})