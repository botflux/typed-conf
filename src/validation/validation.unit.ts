import {describe, it, type TestContext} from 'node:test'
import {object} from "../schemes/object.js";
import {string} from "../schemes/string.js";
import {integer} from "../schemes/integer.js";
import {AjvValidator, getPreRefJsonSchema, ValidationError} from "./validator.js";
import {ref} from "../schemes/ref.js";
import {expect} from "expect";
import {setOrigin} from "../merging/origin-utils.js";
import {inlineCatchSync} from "../utils.js";
import {ipv4} from "../schemes/custom/ipv4.js";

const validator = new AjvValidator()

describe('validation', function () {
  describe('getPreRefJsonSchema', function () {
    it('should be able to create a json schema from a config schema', function () {
      // Given
      const schema = object({
        port: ref({
          schema: integer(),
          sourceName: 'envs',
          refToSourceParams: r => ({key: r}),
        }),
        host: string(),
      })

      // When
      const jsonSchema = getPreRefJsonSchema(schema)

      // Then
      expect(jsonSchema).toEqual({
        type: 'object',
        properties: {
          port: {
            type: 'string',
          },
          host: {
            type: 'string',
          }
        },
        additionalProperties: false,
        required: [ 'port', 'host' ]
      })
    })
  })

  it('should be able to validate a schema', function () {
    // Given
    const schema = object({ port: integer() })
    const config = { port: "foo" }
    setOrigin(config, 'env:PORT')

    // When
    const [v, error] = inlineCatchSync(() => validator.validate(schema, getPreRefJsonSchema, config))

    // Then
    expect(error).toBeInstanceOf(ValidationError)
    expect((error as ValidationError).errors).toEqual([
      new Error('env:PORT must be integer')
    ])
    expect(v).toBeUndefined()
  })

  describe('custom keywords', function () {
    const validator = new AjvValidator()

    it('should be able to validate ipv4', {only: true}, function () {
      // Given
      const schema = object({
        ip: ipv4()
      })
      const data = { ip: 'hello' }
      setOrigin(data, 'envs:IP')

      // When
      const throws = () => validator.validate(schema, base => base.jsonSchema, data)

      // Then
      assertAggregateError(throws, 'config validation failed', [
        new Error('envs:IP must match format "ipv4"')
      ])
    })
  })
})

function assertAggregateError(throws: () => unknown, msg: string, errors: Error[]) {
  try {
    const v = throws()
    throw new Error(`should have throws, received ${v}`)
  } catch (error) {
    assertInstanceOfAggregateError(error)
    expect(error.message).toEqual(msg)
    expect(error.errors).toEqual(errors)
  }
}

function assertInstanceOfAggregateError(error: unknown): asserts error is AggregateError {
  expect(error).toBeInstanceOf(AggregateError)
}