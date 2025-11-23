import {describe, it} from "node:test";
import {string} from "./string.js";
import {integer} from "./integer.js";
import {expect} from "expect";
import {kType} from "./base.js";
import {expectTypeOf} from "expect-type";
import {optional} from "./optional.js";
import {secret} from "./secret.js";
import {object} from "./object.js";
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
    expect(schema).toEqual(expect.objectContaining({
      props: {host: string(), port: integer()},
      beforeRefSchema: {
        type: 'object',
        properties: {
          host: {type: 'string'},
          port: {type: 'integer'},
        },
        required: ['host', 'port'],
        additionalProperties: false,
      }
    }))
  })

  it('should be typed correctly', function () {
    // Given
    // When
    const schema = object({
      host: string(),
      port: integer(),
    })

    // Then
    expectTypeOf(schema[kType]).toEqualTypeOf<{ host: string, port: number }>()
  })

  it('should be able to declare optional props', function () {
    // Given
    // When
    const schema = object({
      port: optional(integer())
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      props: { port: optional(integer()) },
      beforeRefSchema: {
        type: 'object',
        properties: {
          port: {type: 'integer'},
        },
        required: [],
        additionalProperties: false,
      }
    }))
  })

  it('should be able to declare an optional secret', function () {
    // Given
    // When
    const schema = object({
      dbCredentials: secret(optional(string()))
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      beforeRefSchema: {
        type: 'object',
        properties: {
          dbCredentials: {type: 'string'},
        },
        required: [],
        additionalProperties: false,
      }
    }))
  })

  it('should be able to type optional properties correctly', function () {
    // Given
    // When
    const schema = object({
      port: optional(integer())
    })

    // Then
    expectTypeOf(schema[kType]).toEqualTypeOf<{ port: number | undefined }>()
  })

  it('should have to aliases by default', function () {
    // Given
    // When
    const schema = object({
      host: string(),
      port: integer(),
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: []
    }))
  })

  it('should be able to declare aliases', function () {
    // Given
    // When
    const schema = object({
      host: string(),
      port: integer(),
    }, {
      aliases: [envAlias('FOO')]
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: [envAlias('FOO')]
    }))
  })
})