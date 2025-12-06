import {describe, it} from 'node:test'
import {object} from "../../schemes/object.js";
import {string} from "../../schemes/string.js";
import {expect} from "expect";
import {integer} from "../../schemes/integer.js";
import {camelCaseToScreamingSnakeCase, envSource} from "./source.js";
import {boolean} from "../../schemes/boolean.js";
import {kOrigin} from "../../merging/merge.js";

describe('env source', function () {
  describe('#load', function () {
    it('should be able to load a simple value', async function () {
      // Given
      const source = envSource()
      const envs = {FOO: 'bar'}

      // When
      const result = await source.load?.(object({foo: string()}), {envs})

      // Then
      expect(result).toEqual({
        foo: 'bar',
        [kOrigin]: { foo: 'env:FOO' }
      })
    })

    it('should be able to load a property using the camel case naming convention', async function () {
      // Given
      const source = envSource()
      const envs = {FOO_BAR: 'baz'}

      // When
      const result = await source.load?.(object({fooBar: string()}), {envs})

      // Then
      expect(result).toEqual({
        fooBar: 'baz',
        [kOrigin]: { fooBar: 'env:FOO_BAR' }
      })
    })

    it('should be able to load a nested property', async function () {
      // Given
      const source = envSource()
      const envs = {FOO_BAR: 'foo' }

      // When
      const result = await source.load?.(object({foo: object({bar: string()})}), {envs})

      // Then
      expect(result).toEqual({
        foo: {
          bar: 'foo',
          [kOrigin]: { bar: 'env:FOO_BAR' }
        }
      })
    })

    it('should be able to throw an error is there is an ambiguous env', async function () {
      // Given
      const source = envSource()
      const envs = {}

      // When
      const promise = source.load?.(object({
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
        const result = await source.load?.(object({ port: integer() }), {
          envs
        })

        // Then
        expect(result).toEqual({
          port: 3000,
          [kOrigin]: { port: 'env:PORT' }
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
      const result = await source.load?.(object({ host: string(), port: integer() }), { envs })

      // Then
      expect(result).toEqual({
        host: 'localhost',
        port: 3000,
        [kOrigin]: { host: 'env:APP_HOST', port: 'env:APP_PORT' }
      })
    })
  })

  describe('#loadFromParams', function () {
    it('should be able to load an env from a ref', async function () {
      // Given
      const source = envSource()
      const envs = {
        FOO_BAR: 'baz',
      }

      // When
      const result = await source.loadFromParams?.({ key: 'FOO_BAR' }, object({}), { envs }, {})

      // Then
      expect(result).toEqual({
        origin: 'env:FOO_BAR',
        type: 'non_mergeable',
        value: 'baz'
      })
    })

    it('should be able to coerce the value', async function () {
      // Given
      const source = envSource()
      const envs = {
        FOO_BAR: 'false',
      }

      // When
      const result = await source.loadFromParams?.({ key: 'FOO_BAR' }, boolean(), { envs }, {})

      // Then
      expect(result).toEqual({
        origin: 'env:FOO_BAR',
        type: 'non_mergeable',
        value: false
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
