import {describe, it} from "node:test";
import {expect} from "expect";
import {file} from "./schemes.js";

describe('schemes', function () {
  describe('textFile', function () {
    it('should be able to declare a property as a file', function () {
      // Given
      const schema = file()

      // When
      const result = schema.refToSourceParams('file.txt')

      // Then
      expect(result).toEqual({ path: 'file.txt', encoding: 'utf-8' })
    })
  })
})