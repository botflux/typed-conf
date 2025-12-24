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
import {_, Ajv, KeywordCxt} from "ajv";

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

  it('should work', {only: true}, function () {
    // Given
    const ajv = new Ajv()

    ajv.addFormat('foo', d => true)
    ajv.addKeyword({
      type: 'number',
      async: false,
      schemaType: 'boolean',
      keyword: 'even',
      code(cxt: KeywordCxt) {
        const {data, schema} = cxt
        const op = schema ? _`!==` : _`===`
        cxt.fail(_`${data} %2 ${op} 0`) // ... the only code change needed is to use `cxt.fail$data` here
      },
    })
    // When
    // Then
    const isValid = ajv.compile({ type: 'number', even: true })
    console.log(isValid(1), isValid.errors)
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