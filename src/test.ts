import { describe, test } from "node:test"
import assert from "node:assert/strict"
import {c, type Static} from "./c.js"
import {envSource} from "./sources/envs.js";

describe("testing", () => {
  test("should be able to load a config from envs", async t => {
    // Given
    const envs = envSource()

    const configSpec = c.config({
      schema: c.object({
        host: c.string()
      }),
      sources: [ envs ]
    })

    // When
    const config = await configSpec.load({
      sources: {
        envs: { HOST: "localhost" }
      }
    })

    // Then
    assert.deepStrictEqual(config, {
      host: "localhost"
    })
  })

  test("should be able to load a config from envs with a prefix", async t => {
    // Given
    const envs = envSource({ prefix: "APP_" })

    const configSpec = c.config({
      schema: c.object({
        host: c.string()
      }),
      sources: [ envs ]
    })

    // When
    const config = await configSpec.load({
      sources: {
        envs: { APP_HOST: "localhost" }
      }
    })

    // Then
    assert.deepStrictEqual(config, {
      host: "localhost"
    })
  })

  describe('envs', function () {
    test("should be able to load a nested config from envs", async (t) => {
      // Given
      const envs = envSource()
      const configSpec = c.config({
        schema: c.object({
          api: c.object({
            host: c.string()
          })
        }),
        sources: [ envs ]
      })

      // When
      const config = await configSpec.load({
        sources: {
          envs: { API_HOST: "localhost" }
        }
      })

      // Then
      assert.deepStrictEqual(config, {
        api: {
          host: "localhost"
        }
      })
    })

    describe('coercion', function () {
      describe('boolean', function () {
        const scenarios = [
          [ "true", true ] as const,
          [ "tRue", true ] as const,
          [ "false", false ] as const,
          [ "fAlSe", false ] as const,
        ]

        for (const [input, expected] of scenarios) {
          test(`should be able to coerce '${input}' into '${expected}'`, async (t) => {
            // Given
            const envs = envSource()
            const configSpec = c.config({
              schema: c.object({
                enabled: c.boolean()
              }),
              sources: [ envs ]
            })

            // When
            const config = await configSpec.load({
              sources: {
                envs: { ENABLED: input }
              }
            })

            // Then
            assert.deepStrictEqual(config, {
              enabled: expected
            })
          })
        }
      })

      describe('integer', function () {
        const scenarios = [
          [ "111", 111 ] as const,
          [ "0", 0 ] as const,
          [ "-34", -34 ] as const,
        ]

        for (const [input, expected] of scenarios) {
          test(`should be able to coerce '${input}' into '${expected}'`, async (t) => {
            // Given
            const envs = envSource()
            const configSpec = c.config({
              schema: c.object({
                value: c.integer()
              }),
              sources: [ envs ]
            })

            // When
            const config = await configSpec.load({
              sources: {
                envs: { VALUE: input }
              }
            })

            // Then
            assert.deepStrictEqual(config, {
              value: expected
            })
          })
        }
      })
    })
  })
})