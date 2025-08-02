import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { c } from "./c.js"
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
})