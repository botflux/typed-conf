import {describe, it} from 'node:test'
import {object} from "../schemes2/object.js";
import {string} from "../schemes2/string.js";
import {integer} from "../schemes2/integer.js";
import {AjvValidator, getPostRefJsonSchema, getPreRefJsonSchema, ValidationError} from "./validator.js";
import {ref} from "../schemes2/ref.js";
import {expect} from "expect";
import {setOrigin} from "../merging/origin-utils.js";
import {inlineCatchSync} from "../utils.js";

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

  describe('getPostRefJsonSchema', function () {
    // When freshly loaded from sources, a configuration may have refs (like a vault secret path) that
    // are string field. But the actual schema that the ref resolves to is not a string, it can be
    // anything. To be validated correctly, a config schema must have two json schemes representations:
    // one before the refs are resolved, and one after the refs are resolved.
    it('should be able to create a post-ref json schema from a config schema', function () {
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
      const jsonSchema = getPostRefJsonSchema(schema)

      // Then
      expect(jsonSchema).toEqual({
        type: 'object',
        properties: {
          port: {
            type: 'integer',
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
})