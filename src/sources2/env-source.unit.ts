import {describe, it} from 'node:test'
import {isObject, object, type ObjectSchema} from "../schemes2/object.js";
import {string} from "../schemes2/string.js";
import {expect} from "expect";
import type {BaseSchema} from "../schemes2/base.js";
import {setValueAtPath} from "../utils.js";

export type EnvSourceLoadOpts = {
  envs?: NodeJS.ProcessEnv
}

class EnvSource {
  async load(schema: ObjectSchema<Record<string, BaseSchema<unknown>>>, opts: EnvSourceLoadOpts) {
    const {envs = process.env} = opts
    const result: Record<string, unknown> = {}
    const flattened = this.#flattenObjectSchema(schema)

    const seenEnvNames = new Map<string, string>()

    for (const [key, value] of flattened) {
      const envName = camelCasePathToScreamingSnakeCase(key)
      const mSeenEnvName = seenEnvNames.get(envName)

      if (mSeenEnvName !== undefined) {
        throw new Error(`The props ${mSeenEnvName} and ${key.join('.')} resolves to the same env ${envName}`)
      }

      seenEnvNames.set(envName, key.join('.'))

      if (envs[envName] !== undefined) {
        setValueAtPath(result, key, envs[envName])
      }
    }

    return result
  }

  #flattenObjectSchema(schema: BaseSchema<unknown>, prefix: string[] = []): [path: string[], schema: BaseSchema<unknown>][] {
    if (!isObject(schema)) {
      return [[prefix, schema] as const]
    }

    return Object.entries(schema.props).flatMap(([key, schema]) => this.#flattenObjectSchema(
      schema,
      [...prefix, key]
    ))
  }
}

function envSource() {
  return new EnvSource()
}

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
  })
})

function camelCasePathToScreamingSnakeCase(path: string[]) {
  return path.map(camelCaseToScreamingSnakeCase).join('_')
}

function camelCaseToScreamingSnakeCase(name: string) {
  return name.split('').reduce(
    (acc, current, index) => {
      const next = name.at(index + 1)

      if (next === undefined) {
        return acc + current
      }

      const isCurrentLowercase = current.toLowerCase() === current
      const isNextUppercase = next.toUpperCase() === next

      if (isCurrentLowercase && isNextUppercase) {
        return acc + current + '_'
      }

      return acc + current
    }, '').toUpperCase()
}

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
