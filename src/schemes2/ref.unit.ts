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

  it('should be required by default', function () {
    // Given
    // When
    const schema = ref(
      integer(),
      'envs',
      r => ({key: r})
    )

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      optional: false,
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

  it('should be a clear text value by default', function () {
    // Given
    // When
    const schema = ref(
      integer(),
      'envs',
      r => ({key: r})
    )

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      secret: false
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
          optional: false,
          aliases: [],
          secret: false,
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

  describe('optional method', function () {
    it('should be able to declare an optional ref', function () {
      // Given
      // When
      const schema = ref(
        integer(),
        'envs',
        r => ({key: r})
      ).optional()

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        optional: true,
        refSchema: expect.objectContaining({
          plain: expect.objectContaining({
            optional: true,
          })
        })
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
      schema.optional()

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        optional: false
      }))
    })

    it('should be able to change the underlying type', function () {
      // Given
      // When
      const optional = ref(
        integer(),
        'envs',
        r => ({key: r})
      ).optional()

      // Then
      expectTypeOf(optional.plain[kType]).toEqualTypeOf<number | undefined>()
    })

    it('should be able to make the underlying schema optional', function () {
      // Given
      // When
      const optional = ref(
        integer().optional(),
        'envs',
        r => ({key: r})
      ).optional()

      // Then
      expect(optional.plain.refSchema.plain).toEqual(expect.objectContaining({
        optional: true
      }))
    })
  })

  describe('secret method', function () {
    it('should be able to declare a secret ref', function () {
      // Given
      // When
      const schema = ref(
        integer(),
        'envs',
        r => ({key: r})
      ).secret()

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        secret: false,
        refSchema: expect.objectContaining({
          plain: expect.objectContaining({
            secret: true,
          })
        })
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
      schema.secret()

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        secret: false,
        refSchema: expect.objectContaining({
          plain: expect.objectContaining({
            secret: false,
          })
        })
      }))
    })
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