import {describe, it} from "node:test";
import {expect} from "expect";
import {integer} from "./integer.js";
import {kType} from "./base.js";
import {expectTypeOf} from "expect-type";
import {envAlias} from "../sources/envs/envs.js";
import {ref} from "./ref.js";

describe('ref', function () {
  it('should be able to declare a ref', function () {
    // Given
    // When
    const schema = ref({
      schema: integer(),
      sourceName: 'envs',
      refToSourceParams: r => ({key: r}),
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      type: 'ref',
      schema: {
        type: 'string'
      },
    }))
  })

  it('should have no aliases by default', function () {
    // Given
    // When
    const schema = ref({
      schema: integer(),
      sourceName: 'envs',
      refToSourceParams: r => ({key: r})
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: []
    }))
  })

  it('should reference the resolved schema', function () {
    // Given
    // When
    const schema = ref({
      schema: integer(),
      sourceName: 'envs',
      refToSourceParams: r => ({key: r})
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      refSchema: integer()
    }))
  })

  it('should have the same type as the underlying schema', function () {
    // Given
    // When
    const schema = ref({
      schema: integer(),
      sourceName: 'envs',
      refToSourceParams: r => ({key: r})
    })

    // Then
    expectTypeOf(schema[kType]).toEqualTypeOf<number>()
  })

  it('should register the ref to source callback', function () {
    // Given
    // When
    const schema = ref({
      schema: integer(),
      sourceName: 'envs',
      refToSourceParams: r => ({key: r})
    })

    // Then
    expect(schema.refToSourceParams('FOO')).toEqual({
      key: 'FOO'
    })
  })

  it('should register the source\'s name', function () {
    // Given
    // When
    const schema = ref({
      schema: integer(),
      sourceName: 'envs',
      refToSourceParams: r => ({key: r})
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      sourceName: 'envs'
    }))
  })

  describe('aliases', function () {
    it('should be able to declare an alias', function () {
      // Given
      // When
      const schema = ref({
        schema: integer(),
        sourceName: 'envs',
        refToSourceParams: r => ({key: r}),
        aliases: [envAlias('FOO')]
      })

      // Then
      expect(schema).toEqual(expect.objectContaining({
        aliases: [envAlias('FOO')]
      }))
    })

    it('should be able to declare multiple aliases', function () {
      // Given
      // When
      const schema = ref({
        schema: integer(),
        sourceName: 'envs',
        refToSourceParams: r => ({key: r}),
        aliases: [envAlias('FOO'), envAlias('BAR')]
      })

      // Then
      expect(schema).toEqual(expect.objectContaining({
        aliases: [envAlias('FOO'), envAlias('BAR')]
      }))
    })
  })

  describe('coercion', function () {
    // the ref schema doesn't need to do any coercion because the refs are always string.
    it('should be able to do no coercion', function () {
      // Given
      // When
      const schema = ref({schema: integer(), refToSourceParams: r => ({}), sourceName: 'env'})
        .coerce?.('foo')

      // Then
      expect(schema).toEqual('foo')
    })
  })
})