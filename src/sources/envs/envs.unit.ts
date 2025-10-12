import {describe, it} from "node:test";
import {envSource} from "./envs.js";
import {string} from "../../schemes/string.js";
import {object} from "../../schemes/object.js";
import {expect} from "expect";

describe('envs', function () {
  it('should be able to load config from envs', async function () {
    // Given
    const source = envSource()
    const envs = { FOO: 'bar' }
    const schema = object({
      foo: string()
    })

    // When
    const result = await source.load(schema.schema, {}, { envs })

    // Then
    expect(result).toEqual({foo: 'bar'})
  })
})

describe('evaluator function', function () {
  it('should be able to load the envs from the evaluator function', async function () {
    // Given
    const fn = envSource().getEvaluatorFunction?.({}, {
      envs: { FOO: 'bar' }
    })

    // When
    const p = await fn?.fn({ key: 'FOO' })

    // Then
    expect(p).toEqual('bar')
  })

  it('should be able to throw an error given the "key" param is missing', async function () {
    // Given
    const fn = envSource().getEvaluatorFunction?.({}, {
      envs: {}
    })

    // When

    // Then
    expect(() => fn?.fn({})).toThrow(new Error('Env indirections must have a "key" argument that is a string, but received undefined instead.'))
  })
})