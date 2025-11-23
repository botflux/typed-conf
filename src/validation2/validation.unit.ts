import { describe, it } from 'node:test'
import {object} from "../schemes2/object.js";
import {string} from "../schemes2/string.js";
import {integer} from "../schemes2/integer.js";
import {expect} from "expect";
import type {BaseSchema} from "../schemes2/base.js";
import type {JSONSchema} from "json-schema-to-typescript";
import {ref} from "../schemes2/ref.js";
import {Ajv, type ErrorObject, type Schema} from "ajv";
import {getOrigin, setOrigin} from "../merging/origin-utils.js";
import {getValueAtPath, inlineCatchSync} from "../utils.js";

function getPreRefJsonSchema(base: BaseSchema<unknown>): JSONSchema {
  return base.beforeRefSchema
}

function getPostRefJsonSchema(base: BaseSchema<unknown>): JSONSchema {
  return base.afterRefSchema ?? base.beforeRefSchema
}

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

  class ValidationError extends AggregateError {
    errors: Error[] = []

    constructor(errors: Error[]) {
      super(errors, 'config validation failed');
      this.errors = errors;
    }
  }

  type MapErrorObjectToMessage = (obj: ErrorObject, origin?: string) => string

  class AjvValidator {
    #ajv = new Ajv()

    #messagesMap = new Map<string, MapErrorObjectToMessage>()
      .set('type', ((obj: ErrorObject<'type', { type: string }>, origin: string, value: unknown) => `${origin} must be ${obj.params.type}`) as MapErrorObjectToMessage)

    validate(schema: BaseSchema<unknown>, getJsonSchema: (base: BaseSchema<unknown>) => JSONSchema, data: unknown) {
      const jsonSchema = getJsonSchema(schema)

      if (jsonSchema.type !== 'object') {
        throw new Error("Not implemented at line 100 in validation.unit.ts")
      }

      const isValid = this.#ajv.compile(jsonSchema as Schema)
      
      if (!isValid(data)) {
        throw new ValidationError(this.#formatErrors(isValid.errors ?? [], data))
      }
    }

    #formatErrors(errors: ErrorObject[], data: unknown) {
      console.log(errors)
      return errors.map(e => {
        const path = e.instancePath.slice(1).split('/')
        const origins = getOrigin(
          getValueAtPath(data as Record<string, unknown>, path.slice(0, -1)) as Record<string | symbol, unknown>
        )
        const origin = origins[path.at(-1)!]
        const mMapper = this.#messagesMap.get(e.keyword)
        const message = mMapper?.(e, origin) ?? e.message

        return new Error(message)
      })
    }
  }

  const validator = new AjvValidator()

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