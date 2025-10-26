import {describe, it} from "node:test";
import {isObject, object} from "./object.js";
import {string} from "./string.js";
import {integer} from "./integer.js";
import {expect} from "expect";
import {envAlias} from "../sources/envs/envs.js";

describe('object', function () {
  it('should be able to declare an object', function () {
    // Given
    // When
    const schema = object({
      host: string(),
      port: integer(),
    })

    // Then
    expect(schema.schema.afterRefSchema).toEqual({
      type: 'object',
      properties: {
        host: { type: 'string' },
        port: { type: 'integer' },
      },
      required: ['host', 'port'],
      additionalProperties: false,
    })
  })

  it('should be able to declare an optional property', function () {
    // Given
    // When
    const schema = object({
      host: string().optional(),
      port: integer(),
    })

    // Then
    expect(schema.schema.afterRefSchema).toEqual({
      type: 'object',
      properties: {
        host: { type: 'string' },
        port: { type: 'integer' },
      },
      required: ['port'],
      additionalProperties: false,
    })
  })

  it('should be able to declare an optional object', function () {
    // Given
    // When
    const schema = object({}).optional()

    // Then
    expect(schema.schema.optional).toBe(true)
  })

  it('should be required by default', function () {
    // Given
    // When
    const schema = object({})

    // Then
    expect(schema.schema.optional).toBe(false)
  })

  it('should be able to declare aliases', function () {
    // Given
    // When
    const schema = object({}).aliases(envAlias('FOO'))

    // Then
    expect(schema.schema.aliases).toEqual([ envAlias('FOO') ])
  })

  it('should be able to declare an object as secret', function () {
    // Given
    // When
    const schema = object({}).secret()

    // Then
    expect(schema.schema.secret).toBe(true)
  })

  it('should not be a secret by default', function () {
    // Given
    // When
    const schema = object({})

    // Then
    expect(schema.schema.secret).toBe(false)
  })
})

describe('isObject', function () {
  const cases = [
    [ 'an object schema', object({}), true ] as const,
    [ 'a string schema', string(), false ] as const
  ]

  for (const [ caseName, input, expected ] of cases) {
    it(`should be able to return ${expected} given ${caseName}`, function () {
      // Given
      // When
      const result = isObject(input.schema)

      // Then
      expect(result).toBe(expected)
    })
  }
})