import {describe, it} from "node:test";
import {string} from "./string.js";
import {expect} from "expect";
import {kType} from "./base.js";
import {expectTypeOf} from "expect-type";
import {array} from "./array.js";

describe('array', function () {
  it('should be able to declare an array', function () {
    // Given
    // When
    const schema = array(string())

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      type: 'array',
      schema: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    }))
  })

  it('should be required by default', function () {
    // Given
    // When
    const schema = array(string())

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      optional: false
    }))
  })

  it('should have no aliases by default', function () {
    // Given
    // When
    const schema = array(string())

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      aliases: []
    }))
  })

  it('should be a clear text value by default', function () {
    // Given
    // When
    const schema = array(string())

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      secret: false
    }))
  })

  it('should be typed correctly', function () {
    // Given
    // When
    const schema = array(string())

    // Then
    expectTypeOf(schema.plain[kType]).toEqualTypeOf<string[]>()
  })

  describe('optional method', function () {
    it('should be able to declare an optional array', function () {
      // Given
      // When
      const schema = array(string()).optional()

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        optional: true
      }))
    })

    it('should be able to type the underlying type as undefined', function () {
      // Given
      // When
      const schema = array(string()).optional()

      // Then
      expectTypeOf(schema.plain[kType]).toEqualTypeOf<string[] | undefined>()
    })

    it('should be immutable', function () {
      // Given
      const schema = array(string())

      // When
      schema.optional()

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        optional: false
      }))
    })
  })

  describe('secret method', function () {
    it('should be able to declare a secret array', function () {
      // Given
      // When
      const schema = array(string()).secret()

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        secret: true
      }))
    })

    it('should be immutable', function () {
      // Given
      const schema = array(string())

      // When
      schema.secret()

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        secret: false
      }))
    })
  })

  it('should have no min length by default', function () {
    // Given
    // When
    const schema = array(string())

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      schema: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    }))
  })

  describe('minLength method', function () {
    it('should be able to declare a min length', function () {
      // Given
      // When
      const schema = array(string()).minLength(10)

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        schema: {
          type: 'array',
          items: {
            type: 'string',
          },
          minLength: 10
        },
      }))
    })

    it('should be immutable', function () {
      // Given
      const schema = array(string())

      // When
      schema.minLength(10)

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        schema: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      }))
    })
  })

  it('should have no max length by default', function () {
    // Given
    // When
    const schema = array(string())

    // Then
    expect(schema.plain).toEqual(expect.objectContaining({
      schema: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    }))
  })

  describe('maxLength method', function () {
    it('should be able to declare a max length', function () {
      // Given
      // When
      const schema = array(string()).maxLength(10)

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        schema: {
          type: 'array',
          items: {
            type: 'string',
          },
          maxLength: 10
        },
      }))
    })

    it('should be immutable', function () {
      // Given
      const schema = array(string())

      // When
      schema.maxLength(10)

      // Then
      expect(schema.plain).toEqual(expect.objectContaining({
        schema: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      }))
    })
  })
})