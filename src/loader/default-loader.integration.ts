import {describe, it, test} from "node:test";
import {c} from "./default-loader.js";
import {envAlias, envSource} from "../sources/envs/envs.js";
import assert from "node:assert/strict";
import {ValidationError} from "../validation/validation.error.js";

describe('default config loader', function () {
  test("should be able to load a config from envs", async t => {
    // Given
    const configSpec = c.config({
      schema: c.object({
        host: c.string()
      }),
      sources: [envSource()]
    })

    // When
    const config = await configSpec.load({
      sources: {
        envs: {
          envs: {HOST: "localhost"}
        }
      }
    })

    // Then
    assert.deepStrictEqual(config, {
      host: "localhost"
    })
  })

  test("should be able to validate the env variables", async (t) => {
    // Given
    const configSpec = c.config({
      schema: c.object({
        port: c.integer()
      }),
      sources: [envSource()]
    })

    // When
    const promise = configSpec.load({
      sources: {
        envs: {
          envs: {PORT: "not-an-integer"}
        }
      }
    })

    // Then
    await assert.rejects(promise, new ValidationError("PORT (envs) must be integer, got 'not-an-integer'"))
  })

  test("should be able to prefix all the envs", async (t) => {
    // Given
    const configSpec = c.config({
      schema: c.object({
        host: c.string()
      }),
      sources: [envSource({prefix: "APP_"})]
    })

    // When
    const config = await configSpec.load({
      sources: {
        envs: {
          envs: {APP_HOST: "localhost"}
        }
      }
    })

    // Then
    assert.deepStrictEqual(config, {host: "localhost"})
  })

  test("should be able to load nested objects from envs", async (t) => {
    // Given
    const configSpec = c.config({
      schema: c.object({
        api: c.object({
          host: c.string()
        })
      }),
      sources: [envSource()]
    })

    // When
    const config = await configSpec.load({
      sources: {
        envs: {
          envs: {API_HOST: "localhost"}
        }
      }
    })

    // Then
    assert.deepStrictEqual(config, {
      api: {
        host: "localhost"
      }
    })
  })

  test("should be able to define alias for a given env", async (t) => {
    // Given
    const configSpec = c.config({
      schema: c.object({
        host: c.string().aliases(envAlias("MY_SPECIAL_HOST"))
      }),
      sources: [envSource()]
    })

    // When
    const config = await configSpec.load({
      sources: {
        envs: {
          envs: {MY_SPECIAL_HOST: "localhost"}
        }
      }
    })

    // Then
    assert.deepStrictEqual(config, {
      host: "localhost"
    })
  })

  test("should be able to ignore the env prefix when using a env alias", async (t) => {
    // Given
    const configSpec = c.config({
      schema: c.object({
        host: c.string().aliases(envAlias("HOST"))
      }),
      sources: [envSource({prefix: "APP_"})]
    })

    // When
    const config = await configSpec.load({
      sources: {
        envs: {
          envs: {HOST: "localhost"}
        }
      }
    })

    // Then
    assert.deepStrictEqual(config, {
      host: "localhost"
    })
  })

  test("should be able to ignore additional envs", async (t) => {
    // Given
    const configSpec = c.config({
      schema: c.object({}),
      sources: [envSource()]
    })

    // When
    const config = await configSpec.load({
      sources: {
        envs: {
          envs: {
            HOST: "localhost",
          }
        }
      }
    })

    // Then
    assert.deepStrictEqual(config, {})
  })

})