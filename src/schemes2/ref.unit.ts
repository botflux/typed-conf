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
    const schema = ref(
      integer(),
      'envs',
      r => ({key: r})
    )

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      type: 'ref',
      schema: {
        type: 'string'
      },
    }))
  })

  it('should have no aliases by default', function () {
    // Given
    // When
    const schema = ref(
      integer(),
      'envs',
      r => ({key: r})
    )

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      aliases: []
    }))
  })

  it('should reference the resolved schema', function () {
    // Given
    // When
    const schema = ref(
      integer(),
      'envs',
      r => ({key: r})
    )

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      refSchema: expect.objectContaining({
        plain: {
          type: 'integer',
          aliases: [],
          schema: {
            type: 'integer'
          },
          [kType]: 0 as number,
        }
      })
    }))
  })

  it('should have the same type as the underlying schema', function () {
    // Given
    // When
    const schema = ref(
      integer(),
      'envs',
      r => ({key: r})
    )

    // Then
    expectTypeOf(schema.plain[kType]).toEqualTypeOf<number>()
  })

  it('should register the ref to source callback', function () {
    // Given
    // When
    const schema = ref(
      integer(),
      'envs',
      r => ({key: r})
    )

    // Then
    expect(schema.plain.refToSourceParams('FOO')).toEqual({
      key: 'FOO'
    })
  })

  it('should register the source\'s name', function () {
    // Given
    // When
    const schema = ref(
      integer(),
      'envs',
      r => ({key: r})
    )

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      sourceName: 'envs'
    }))
  })

  describe('aliases', function () {
    it('should be able to declare an alias', function () {
      // Given
      // When
      const schema = ref(
        integer(),
        'envs',
        r => ({key: r})
      ).aliases(envAlias('FOO'))

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        aliases: [envAlias('FOO')]
      }))
    })

    it('should be able to declare multiple aliases', function () {
      // Given
      // When
      const schema = ref(
        integer(),
        'envs',
        r => ({key: r})
      ).aliases(envAlias('FOO'), envAlias('BAR'))

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        aliases: [envAlias('FOO'), envAlias('BAR')]
      }))
    })

    it('should be immutable', function () {
      // Given
      const schema = ref(
        integer(),
        'envs',
        r => ({key: r})
      )

      // When
      schema.aliases(envAlias('FOO'))

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        aliases: []
      }))
    })

    it('should be able to append aliases', function () {
      // Given
      // When
      const schema = ref(
        integer(),
        'envs',
        r => ({key: r})
      ).aliases(envAlias('FOO')).aliases(envAlias('BAR'))

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        aliases: [envAlias('FOO'), envAlias('BAR')]
      }))
    })
  })
})