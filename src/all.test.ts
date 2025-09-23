import { describe, test } from "node:test"
import assert from "node:assert/strict"
import {c} from "./loader.js"
import {envAlias, envSource} from "./sources/envs.js";
import {FakeFileSystem, fileSource} from "./sources/files.js";
import {VaultContainer} from "@testcontainers/vault";
import {vaultConfig, vaultSource} from "./sources/vault.js";
import vault from "node-vault"

describe('env variable loading', function () {
  test("should be able to load a config from envs", async t => {
    // Given
    const configSpec = c.config({
      schema: c.object({
        host: c.string()
      }),
      sources: [ envSource() ]
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

  test("should be able to validate the env variables", async (t) => {
    // Given
    const configSpec = c.config({
      schema: c.object({
        port: c.integer()
      }),
      sources: [ envSource() ]
    })

    // When
    const promise = configSpec.load({
      sources: {
        envs: { PORT: "not-an-integer" }
      }
    })

    // Then
    await assert.rejects(promise, new Error("PORT (envs) must be integer, got 'not-an-integer'"))
  })

  test("should be able to prefix all the envs", async (t) => {
    // Given
    const configSpec = c.config({
      schema: c.object({
        host: c.string()
      }),
      sources: [ envSource({ prefix: "APP_" }) ]
    })

    // When
    const config = await configSpec.load({
      sources: {
        envs: { APP_HOST: "localhost" }
      }
    })

    // Then
    assert.deepStrictEqual(config, { host: "localhost" })
  })

  test("should be able to load nested objects from envs", async (t) => {
    // Given
    const configSpec = c.config({
      schema: c.object({
        api: c.object({
          host: c.string()
        })
      }),
      sources: [ envSource() ]
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

  test("should be able to define alias for a given env", async (t) => {
    // Given
    const configSpec = c.config({
      schema: c.object({
        host: c.string().aliases(envAlias("MY_SPECIAL_HOST"))
      }),
      sources: [ envSource() ]
    })

    // When
    const config = await configSpec.load({
      sources: {
        envs: { MY_SPECIAL_HOST: "localhost" }
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
      sources: [ envSource({ prefix: "APP_" }) ]
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

  test.todo("should be able to ignore additional envs", (t) => {
    // Given

    // When
    // Then
  })
})

describe('file config loading', function () {
  test.todo("should be able to load a config from a json file", (t) => {
    // Given

    // When
    // Then
  })

  test.todo("should be able to validate the config loaded from a file", (t) => {
    // Given

    // When
    // Then
  })

  test.todo("should be able to ignore additional properties", (t) => {
    // Given

    // When
    // Then
  })
})

describe('hashicorp vault secret loading', function () {
  test.todo("should be able to not load anything by default", (t) => {
    // Given

    // When
    // Then
  })

  test.todo("should be able to load static secrets", (t) => {
    // Given

    // When
    // Then
  })

  test.todo("should be able to load dynamic secrets", (t) => {
    // Given

    // When
    // Then
  })
})

describe('merging configurations', function () {
  test.todo("should be able to merge configuration coming from multiple sources", (t) => {
    // Given

    // When
    // Then
  })

  test.todo("should be able to throw an error if the a config property is missing", (t) => {
    // Given

    // When
    // Then
  })
})

describe('config interpolation', function () {
  test.todo("should be able to evaluate interpolation expression", (t) => {
    // Given

    // When
    // Then
  })
})

describe('deprecation', function () {
  test.todo("should be able to mark a config as deprecated", (t) => {
    // Given
    // When
    // Then
  })
})

describe('reporting', function () {
  test.todo("should be able to report if a config from a given file is overridden", (t) => {
    // Given

    // When
    // Then
  })

  test.todo("should be able to report the origin of each config", (t) => {
    // Given

    // When
    // Then
  })

  test.todo("should be able to report given a deprecated config field was provided", (t) => {
    // Given

    // When
    // Then
  })
})

describe("testing", () => {
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

  test("should be able to declare a secret", async (t) => {
    // Given
    const configSpec = c.config({
      schema: c.object({
        dbPassword: c.secret()
      }),
      sources: [
        envSource({ loadSecrets: true })
      ]
    })

    // When
    const config = await configSpec.load({
      sources: {
        envs: { DBPASSWORD: "my-secret-db-password" }
      }
    })

    // Then
    assert.deepStrictEqual(config, { dbPassword: "my-secret-db-password" })
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

    test("should not be able to load secrets by default", async (t) => {
      // Given
      const configSpec = c.config({
        schema: c.object({
          password: c.secret().optional()
        }),
        sources: [
          envSource()
        ]
      })

      // When
      const config = await configSpec.load({
        sources: {
          envs: { PASSWORD: "my-pass" }
        }
      })

      // Then
      assert.deepStrictEqual(config, {})
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

      describe('float', function () {
        const scenarios = [
          [ "3.14", 3.14 ] as const,
          [ "-3.14", -3.14 ] as const,
        ]

        for (const [input, expected] of scenarios) {
          test(`should be able to coerce '${input}' into '${expected}'`, async (t) => {
            // Given
            const envs = envSource()
            const configSpec = c.config({
              schema: c.object({
                value: c.float()
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

    describe('aliases', function () {
      test("should be able to load a config from an alias", async t => {
        // Given
        const envs = envSource()

        const configSpec = c.config({
          schema: c.object({
            host: c.string().aliases(envAlias("MY_SPECIAL_HOST"))
          }),
          sources: [ envs ]
        })

        // When
        const config = await configSpec.load({
          sources: {
            envs: { MY_SPECIAL_HOST: "localhost" }
          }
        })

        // Then
        assert.deepStrictEqual(config, {
          host: "localhost"
        })
      })

      test("should be able to load a config from the normal key by default", async t => {
        // Given
        const envs = envSource()

        const configSpec = c.config({
          schema: c.object({
            host: c.string().aliases(envAlias("MY_SPECIAL_HOST"))
          }),
          sources: [ envs ]
        })

        // When
        const config = await configSpec.load({
          sources: {
            envs: {
              HOST: "localhost",
              MY_SPECIAL_HOST: "host.docker.internal"
            }
          }
        })

        // Then
        assert.deepStrictEqual(config, {
          host: "localhost"
        })
      })
    })

    describe('indirection', function () {
      test("should be able to reference a configuration from another source", async (t) => {
        // Given
        const fs = new FakeFileSystem()
          .addFile("config.json", JSON.stringify({ host: "%envs('ANOTHER_HOST_ENV_ENTRY')" }))

        const configSpec = c.config({
          schema: c.object({
            host: c.string()
          }),
          sources: [
            envSource(),
            fileSource({ file: "config.json" })
          ]
        })

        // When
        const config = await configSpec.load({
          sources: {
            envs: { ANOTHER_HOST_ENV_ENTRY: "localhost" },
            file: { fs }
          }
        })

        // Then
        assert.deepStrictEqual(config, {
          host: "localhost"
        })
      })
    })

    describe('validation', function () {
      test("should be able to validate the envs", async (t) => {
        // Given
        const envs = envSource()
        const configSpec = c.config({
          schema: c.object({
            port: c.integer()
          }),
          sources: [ envs ]
        })

        // When
        const promise = configSpec.load({
          sources: {
            envs: { PORT: "not-an-integer" }
          }
        })

        // Then
        await assert.rejects(promise, new Error("PORT (envs) must be integer, got 'not-an-integer'"))
      })
    })
  })

  describe('files', function () {
    test("should be able to load config from a json file", async (t) => {
      // Given
      const fs = new FakeFileSystem()
        .addFile("config.json", JSON.stringify({ host: "localhost" }))

      const configSpec = c.config({
        schema: c.object({
          host: c.string()
        }),
        sources: [
          fileSource({ file: "config.json" })
        ]
      })

      // When
      const config = await configSpec.load({
        sources: {
          file: { fs }
        }
      })

      // Then
      assert.deepStrictEqual(config, { host: "localhost" })
    })

    describe('validation', function () {
      test("should be able to validate config loaded from a file", async (t) => {
        // Given
        const fs = new FakeFileSystem()
          .addFile("config.json", JSON.stringify({ port: "not-an-integer" }))

        const configSpec = c.config({
          schema: c.object({
            port: c.integer()
          }),
          sources: [
            fileSource({ file: "config.json" })
          ]
        })

        // When
        const promise = configSpec.load({
          sources: {
            file: { fs }
          }
        })

        // Then
        await assert.rejects(promise, new Error("port (file config.json) must be integer, got 'not-an-integer'"))
      })
    })
  })

  describe('hashicorp vault', function () {
    test("should be able to load secrets from hashicorp vault", async (t) => {
      // Given
      const token = "my-token"
      const image = "hashicorp/vault:1.20"
      const secretValue = "my-secret-value"

      const container = await new VaultContainer(image)
          .withVaultToken(token)
          .withReuse()
          .start()

      const client = vault({
        apiVersion: "v1",
        token: container.getRootToken()!,
        endpoint: container.getAddress()
      })

      await client.write("secret/data/secret", {
        data: {
          value: secretValue
        }
      })

      const configSpec = c.config({
        schema: c.object({
          secret: c.secret(),
          vault: vaultConfig
        }),
        sources: [
          envSource({ loadSecrets: true }),
          vaultSource()
        ]
      })

      // When
      const config = await configSpec.load({
        sources: {
          envs: {
            VAULT_TOKEN: container.getRootToken(),
            VAULT_ENDPOINT: container.getAddress(),
            SECRET: "%vault('secret/data/secret', 'value')"
          },
        }
      })

      // Then
      assert.deepStrictEqual(config, {
        vault: {
          endpoint: container.getAddress(),
          token: container.getRootToken()
        },
        secret: secretValue
      })
    })
  })
})