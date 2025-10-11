import {describe, it} from "node:test";
import {ref} from "./ref.js";
import {string} from "./string.js";
import {expect} from "expect";
import {envAlias} from "../sources/envs.js";

describe('ref', function () {
  it('should be able to declare a ref', function () {
    // Given
    // When
    const schema = ref(
      string(),
      'envs',
      r => ({  })
    )

    // Then
    expect(schema.schema.schema).toEqual({
      type: 'string',
    })
  })

  it('should be able to declare an optional ref', function () {
    // Given
    // When
    const schema = ref(
      string(),
      'envs',
      r => ({})
    ).optional()

    // Then
    expect(schema.schema.optional).toBe(true)
  })

  it('should be required by default', function () {
    // Given
    // When
    const schema = ref(
      string(),
      'envs',
      r => ({})
    )

    // Then
    expect(schema.schema.optional).toBe(false)
  })

  it('should be able to declare aliases', function () {
    // Given
    // When
    const schema = ref(string(), 'envs', r => ({})).aliases(envAlias('FOO'))

    // Then
    expect(schema.schema.aliases).toEqual([envAlias('FOO')])
  })

  it('should be able to declare a secret ref', function () {
    // Given
    // When
    const schema = ref(string(), 'envs', r => ({})).secret()

    // Then
    expect(schema.schema.secret).toBe(true)
  })

  it('should not be a secret by default', function () {
    // Given
    // When
    const schema = ref(string(), 'envs', r => ({}))

    // Then
    expect(schema.schema.secret).toBe(false)
  })
})