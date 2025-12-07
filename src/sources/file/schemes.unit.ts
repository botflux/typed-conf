import {describe, it} from "node:test";
import {expect} from "expect";
import {file} from "./schemes.js";
import {expectTypeOf} from "expect-type";
import {kType} from "../../schemes/base.js";
import {object} from "../../schemes/object.js";
import {string} from "../../schemes/string.js";

describe('schemes', function () {
  describe('file', function () {
    it('should be able to declare a file schema', function () {
      // Given
      const schema = file()

      // When
      const result = schema.refToSourceParams('file.txt')

      // Then
      expect(result).toEqual({ file: 'file.txt', encoding: undefined, parse: false })
    })

    it('should be able to be typed as a buffer by default', function () {
      // Given
      // When
      const schema = file()

      // Then
      expectTypeOf(schema[kType]).toEqualTypeOf<Buffer>()
    })

    it('should be able to define an encoding', function () {
      // Given
      const schema = file('utf8')

      // When
      const result = schema.refToSourceParams('file.txt')

      // Then
      expect(result).toEqual({ file: 'file.txt', encoding: 'utf8', parse: false })
    })

    it('should be able to be typed as string when an encoding is defined', function () {
      // Given
      // When
      const schema = file('utf8')

      // Then
      expectTypeOf(schema[kType]).toEqualTypeOf<string>()
    })

    it('should be able to parse the file content', function () {
      // Given
      // When
      const schema = file({
        encoding: 'utf8',
        parseAs: object({ foo: string() })
      })

      // Then
      expect(schema.refToSourceParams('file.txt')).toEqual(expect.objectContaining({
        file: 'file.txt',
        encoding: 'utf8',
        parse: true
      }))
    })

    it('should be able to contain the parsed content schema', function () {
      // Given
      // When
      const schema = file({
        encoding: 'utf8',
        parseAs: object({ foo: string() })
      })

      // Then
      expect(schema).toEqual(expect.objectContaining({
        refSchema: object({ foo: string() })
      }))
    })

    it('should be able to be typed correctly given there is a parseAs option', function () {
      // Given
      // When
      const schema = file({
        encoding: 'utf8',
        parseAs: object({ foo: string() })
      })

      // Then
      expectTypeOf(schema[kType]).toEqualTypeOf<{ foo: string }>()
    })
  })
})