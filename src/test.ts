import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { c } from "./c.js"

describe("testing", () => {
  test("should be able to load a config from envs", async t => {
    // Given
    const configSpec = c.config({
      host: c.string()
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
})