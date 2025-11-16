import {describe, it} from 'node:test'
import {object} from "../schemes2/object.js";
import {string} from "../schemes2/string.js";
import {expect} from "expect";
import {integer} from "../schemes2/integer.js";
import {camelCaseToScreamingSnakeCase, envSource} from "./env-source.js";

describe('env source', function () {
  describe('#load', function () {
    it('should be able to load a simple value', async function () {
      // Given
      const source = envSource()
      const envs = {FOO: 'bar'}

      // When
      const result = await source.load(object({foo: string()}), {envs})

      // Then
      expect(result).toEqual({foo: 'bar'})
    })

    it('should be able to load a property using the camel case naming convention', async function () {
      // Given
      const source = envSource()
      const envs = {FOO_BAR: 'baz'}

      // When
      const result = await source.load(object({fooBar: string()}), {envs})

      // Then
      expect(result).toEqual({fooBar: 'baz'})
    })

    it('should be able to load a nested property', async function () {
      // Given
      const source = envSource()
      const envs = {FOO_BAR: 'foo' }

      // When
      const result = await source.load(object({foo: object({bar: string()})}), {envs})

      // Then
      expect(result).toEqual({foo: {bar: 'foo'}})
    })

    it('should be able to throw an error is there is an ambiguous env', async function () {
      // Given
      const source = envSource()
      const envs = {}

      // When
      const promise = source.load(object({
        fooBar: string(),
        foo: object({bar: string()})
      }), { envs })

      // Then
      await expect(promise).rejects.toThrow(new Error('The props fooBar and foo.bar resolves to the same env FOO_BAR'))
    })

    describe('coercion', function () {
      it('should be able to coerce the value', async function () {
        // Given
        const source = envSource()
        const envs = {PORT: '3000'}

        // When
        const result = await source.load(object({ port: integer() }), {
          envs
        })

        // Then
        expect(result).toEqual({
          port: 3000
        })
      })
    })

    it('should be able to add a prefix to all the envs loaded', async function () {
      // Given
      const source = envSource({ prefix: 'APP' })
      const envs = {
        APP_HOST: 'localhost',
        APP_PORT: '3000',
      }

      // When
      const result = await source.load(object({ host: string(), port: integer() }), { envs })

      // Then
      expect(result).toEqual({
        host: 'localhost',
        port: 3000,
      })
    })
  })
})

describe('camelCaseToScreamingSnakeCase', function () {
  it('should be able to convert a simple word to screaming snake case', function () {
    // Given
    // When
    // Then
    expect(camelCaseToScreamingSnakeCase('foo')).toEqual('FOO')
  })

  it('should be able to convert a name composed of two words', function () {
    // Given
    // When
    // Then
    expect(camelCaseToScreamingSnakeCase('fooBar')).toEqual('FOO_BAR')
  })
})
