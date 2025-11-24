import {describe, it} from "node:test";
import {isVaultConfig, kVault, vaultConfig} from "./schemes.js";
import {expect} from "expect";
import {object} from "../../schemes2/object.js";
import {string} from "../../schemes2/string.js";

describe('schemes', function () {
  it('should be able to declare a vault config schema with a metadata', function () {
    // Given
    // When
    const schema = vaultConfig

    // Then
    expect(schema).toEqual(expect.objectContaining({
      metadata: {
        [kVault]: true
      }
    }))
  })
})

describe('isVaultConfig', function () {
  const testCases = [
    { input: vaultConfig, expected: true, case: 'a vault config' },
    { input: object({}), expected: false, case: 'an object' },
    { input: string(), expected: false, case: 'a string' },
  ]

  for (const { input, expected, case: scenario } of testCases) {
    it(`should be able to return ${expected} given ${scenario}`, function () {
      // Given
      // When
      const result = isVaultConfig(input)

      // Then
      expect(result).toBe(expected)
    })
  }
})