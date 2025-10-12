import {describe, it} from "node:test";
import {object} from "../../schemes/object.js";
import {string} from "../../schemes/string.js";
import {extractVaultConfig, vaultDynamicSecret, vaultSource} from "./vault.js";
import {expect} from "expect";

describe('vaultDynamicSecret', function () {
  it('should be able to create a ref holding a vault dynamic secret', function () {
    // Given
    // When
    const schema = vaultDynamicSecret({
      password: string()
    })

    // Then
    expect(schema.schema.targetSchema.schema.schema).toEqual({
      type: 'object',
      properties: {
        data: {
          type: 'object',
          additionalProperties: false,
          properties: {
            password: {type: 'string'},
          },
          required: ['password'],
        },
        expiresAt: {type: 'integer'},
        lease_duration: {type: 'integer'},
        lease_id: {type: 'string'},
        renewable: { type: 'boolean' },
        request_id: {type: 'string'},
      },
      additionalProperties: false,
      required: ['lease_duration', 'lease_id', 'renewable', 'request_id', 'data', 'expiresAt'],
    })
  })
})

describe('evaluator function', function () {
  it('should be able to throw given the path argument is not a string', async function () {
    // Given
    const fn = vaultSource().getEvaluatorFunction?.({}, {})

    // When
    const p = fn?.fn({ path: 2341 })

    // Then
    await expect(p).rejects.toThrow(new Error('Expect argument "path" to be a string, got "2341"'))
  })
})

describe('extractVaultConfig', function () {
  it('should be able to able to extract the vault configuration from an object', function () {
    // Given
    const config = {
      vault: {
        endpoint: 'http://localhost:3000',
        token: 'my token'
      }
    }

    // When
    const result = extractVaultConfig(config, 'vault')

    // Then
    expect(result).toEqual({ endpoint: 'http://localhost:3000', token: 'my token' })
  })

  it('should be able to throw an error given the vault configuration is not present', function () {
    // Given
    const config = {}

    // When
    // Then
    expect(() => extractVaultConfig(config, 'vault'))
      .toThrow(new Error('Expect the configuration to contain a "vault" property holding the vault configuration'))
  })
})