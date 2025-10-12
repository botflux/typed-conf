import {describe, it, test} from "node:test";
import {c} from "../loader.js";
import {expect} from "expect";
import {envAlias} from "../sources/envs/envs.js";

describe('boolean', function () {
  it('should be able to create a boolean schema', function () {
    // Given
    // When
    const schema = c.boolean()

    // Then
    expect(schema.schema.schema).toEqual({
      type: 'boolean',
    })
  })

  it('should be able to create required boolean by default', function () {
    // Given
    // When
    const schema = c.boolean()

    // Then
    expect(schema.schema.optional).toBe(false)
  })

  it('should be able to create an optional boolean', function () {
    // Given
    // When
    const schema = c.boolean().optional()

    // Then
    expect(schema.schema.optional).toBe(true)
  })

  it('should be able to register aliases', function () {
    // Given
    // When
    const schema = c.boolean().aliases(envAlias('FOO'))

    // Then
    expect(schema.schema.aliases).toStrictEqual([envAlias('FOO')])
  })

  describe('coercion', function () {
    const scenarios = [
      ["true", true] as const,
      ["tRue", true] as const,
      ["false", false] as const,
      ["fAlSe", false] as const,
      [ 1, 1 ] as const
    ]

    for (const [input, expected] of scenarios) {
      test(`should be able to coerce '${input}' into '${expected}'`, async (t) => {
        // Given
        const boolean = c.boolean()

        // When
        const result = boolean.schema.coerce?.(input)

        // Then
        expect(result).toBe(expected)

        // // Given
        // const envs = envSource()
        // const configSpec = c.config({
        //   schema: c.object({
        //     enabled: c.boolean()
        //   }),
        //   sources: [envs]
        // })
        //
        // // When
        // const config = await configSpec.load({
        //   sources: {
        //     envs: {
        //       envs: {ENABLED: input}
        //     }
        //   }
        // })
        //
        // // Then
        // assert.deepStrictEqual(config, {
        //   enabled: expected
        // })
      })
    }
  })

  it('should be able to declare a secret', function () {
    // Given
    // When
    const schema = c.boolean().secret()

    // Then
    expect(schema.schema.secret).toBe(true)
  })

  it('should not be a secret by default', function () {
    // Given
    // When
    const schema = c.boolean()

    // Then
    expect(schema.schema.secret).toBe(false)
  })
})