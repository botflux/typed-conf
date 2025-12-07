import {describe, it} from "node:test";
import {expect} from "expect";
import {file} from "./schemes.js";
import {expectTypeOf} from "expect-type";
import {kType} from "../../schemes/base.js";

describe('schemes', function () {
  describe('file', function () {
    it('should be able to declare a file schema', function () {
      // Given
      const schema = file()

      // When
      const result = schema.refToSourceParams('file.txt')

      // Then
      expect(result).toEqual({ file: 'file.txt', encoding: undefined })
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
      expect(result).toEqual({ file: 'file.txt', encoding: 'utf8' })
    })

    it('should be able to be typed as string when an encoding is defined', function () {
      // Given
      // When
      const schema = file('utf8')

      // Then
      expectTypeOf(schema[kType]).toEqualTypeOf<string>()
    })
  })
})