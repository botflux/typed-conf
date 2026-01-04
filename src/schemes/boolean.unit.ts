import {describe, it} from "node:test";
import {expect} from "expect";
import {expectTypeOf} from "expect-type";
import {kType} from "./base.js";
import {boolean} from "./boolean.js";
import {envAlias} from "../sources/env/alias.js";
import * as typebox from '@sinclair/typebox'

describe('boolean', function () {
  it('should be able to declare a boolean', function () {
    // Given
    // When
    const schema = boolean()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      jsonSchema: {
        type: 'boolean'
      }
    }))
  })

  it('should have a validation schema', function () {
    // Given
    // When
    const schema = boolean()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      validationSchema: typebox.Boolean()
    }))
  })

  it('should have no aliases by default', function () {
    // Given
    // When
    const schema = boolean()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: []
    }))
  })

  it('should be a boolean type', function () {
    // Given
    // When
    const schema = boolean()

    // Then
    expectTypeOf(schema[kType]).toEqualTypeOf<boolean>()
  })

  it('should be able to declare an alias', function () {
    // Given
    // When
    const schema = boolean({
      aliases: [ envAlias('FOO') ]
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: [envAlias('FOO')]
    }))
  })

  it('should be able to declare multiple aliases', function () {
    // Given
    // When
    const schema = boolean({
      aliases: [ envAlias('FOO'), envAlias('BAR') ]
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: [envAlias('FOO'), envAlias('BAR')]
    }))
  })

  describe('coercion', function () {
    it('should be able to coerce "true" to true', function () {
      // Given
      // When
      const result = boolean().coerce('true')

      // Then
      expect(result).toEqual(true)
    })

    it('should be able to coerce "false" to false', function () {
      // Given
      // When
      const result = boolean().coerce('false')

      // Then
      expect(result).toEqual(false)
    })

    it('should be able to ignore strings others than "true" or "false"', function () {
      // Given
      // When
      const result = boolean().coerce('foo')

      // Then
      expect(result).toEqual('foo')
    })

    it('should be able to ignore non strings', function () {
      // Given
      // When
      const result = boolean().coerce({ hello: 'world' })

      // Then
      expect(result).toEqual({ hello: 'world' })
    })
  })

  it('should be able to mark as deprecated', function () {
    // Given
    // When
    const schema = boolean({
      deprecated: true
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      deprecated: true,
      jsonSchema: expect.objectContaining({ deprecated: true }),
    }))
  })

  it('should not be deprecated by default', function () {
    // Given
    // When
    const schema = boolean()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      deprecated: false,
    }))
  })
})