import {after, before, describe, it, test} from "node:test"
import assert from "node:assert/strict"
import {c} from "../loader.js"
import {envAlias, envSource} from "../sources/envs/envs.js";
import {file, fileSource} from "../sources/files/files.js";
import {StartedVaultContainer, VaultContainer} from "@testcontainers/vault";
import {renewSecret, vaultConfig, vaultDynamicSecret, vaultSource} from "../sources/vault/vault.js";
import vault from "node-vault"
import {MongoDBContainer, StartedMongoDBContainer} from "@testcontainers/mongodb";
import {Network, StartedNetwork} from "testcontainers"
import {expect} from "expect";
import {boolean} from "../schemes/boolean.js";
import {FakeClock} from "../clock/fake-clock.js";
import {ValidationError} from "../validation/validation.error.js";
import {FakeFileSystem} from "../sources/files/file-system.js";

describe('env variable loading', function () {
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

  describe('boolean coercion', function () {
    const b = boolean()

    it('should be able to coerce the string "true" to true', function () {
      // Given
      // When
      const coerced = b.schema.coerce!("true")

      // Then
      expect(coerced).toBe(true)
    })

    it('should be able to coerce the string "false" to false', function () {
      // Given
      // When
      const coerced = b.schema.coerce!("false")

      // Then
      expect(coerced).toBe(false)
    })

    it('should be able to coerce "true" with a wrong case to "true"', function () {
      // Given
      // When
      const coerced = b.schema.coerce!("tRue")

      // Then
      expect(coerced).toBe(true)
    })

    it('should be able to coerce "false" with a wrong case to "false"', function () {
      // Given
      // When
      const coerced = b.schema.coerce!("fAlSe")

      // Then
      expect(coerced).toBe(false)
    })

    it('should be able to do nothing given the value is not a string', function () {
      // Given
      // When
      const coerced = b.schema.coerce!(1)

      // Then
      expect(coerced).toBe(1)
    })
  })

  describe('indirection expression', function () {
    it('should be able to throw if the no env key was passed', function () {
      // Given
      const source = envSource()
      const fn = source.getEvaluatorFunction!({}, {})

      // When
      // Then
      expect(() => fn.fn({})).toThrow(new Error("Env indirections must have a \"key\" argument that is a string, but received undefined instead."))
    })
  })
})

describe('file config loading', function () {
  test("should be able to load a config from a json file", async (t) => {
    // Given
    const fs = new FakeFileSystem()
      .addFile("config.json", JSON.stringify({host: "localhost"}))

    const configSpec = c.config({
      schema: c.object({
        host: c.string()
      }),
      sources: [fileSource({file: "config.json"})]
    })

    // When
    const config = await configSpec.load({
      sources: {
        file: {fs}
      }
    })

    // Then
    assert.deepStrictEqual(config, {host: "localhost"})
  })

  test("should be able to validate the config loaded from a file", async (t) => {
    // Given
    const fs = new FakeFileSystem().addFile("config.json", JSON.stringify({port: "not-an-integer"}))
    const configSpec = c.config({
      schema: c.object({
        port: c.integer()
      }),
      sources: [fileSource({file: "config.json"})]
    })

    // When
    const promise = configSpec.load({
      sources: {
        file: {fs}
      }
    })

    // Then
    await assert.rejects(promise, new ValidationError("port (file config.json) must be integer, got 'not-an-integer'"))
  })

  test("should be able to ignore additional properties", async (t) => {
    // Given
    const fs = new FakeFileSystem().addFile("config.json", JSON.stringify({port: 8080, host: "localhost"}))
    const configSpec = c.config({
      schema: c.object({
        port: c.integer()
      }),
      sources: [fileSource({file: "config.json"})]
    })

    // When
    const config = await configSpec.load({
      sources: {
        file: {fs}
      }
    })

    // Then
    assert.deepStrictEqual(config, {port: 8080})
  })

  it('should be able to load a file in a single config prop', async function () {
    // Given
    const fs = new FakeFileSystem()
    const configSpec = c.config({
      schema: c.object({
        key: file('txt')
      }),
      sources: [
        fileSource({file: 'config.json'}),
      ]
    })

    fs.addFile('key.pub', 'helloworld')
      .addFile('config.json', '{ "key": "key.pub" }')

    // When
    const config = await configSpec.load({
      sources: {
        file: { fs }
      }
    })

    // Then
    expect(config).toEqual({
      key: 'helloworld'
    })
  })

  it('should be able to declare the file source without any file to load', async function () {
    // Given
    const fs = new FakeFileSystem()
    const configSpec = c.config({
      schema: c.object({
        port: c.integer().optional()
      }),
      sources: [
        fileSource()
      ]
    })

    // When
    const loaded = await configSpec.load({
      sources: {
        file: { fs }
      },
    })

    // Then
    expect(loaded).toEqual({})
  })
})

describe('hashicorp vault secret loading', function () {
  let network!: StartedNetwork
  let vaultContainer!: StartedVaultContainer
  let mongodbContainer!: StartedMongoDBContainer
  const token = "token"

  before(async () => {
    const mongodbUsername = "test"
    const mongodbPassword = "testpass"
    const mongodbNetworkAlias = "mongodb"

    const vaultMongoConfigName = "my-mongodb-database"
    const vaultMongoRole = "my-role"

    network = await new Network().start()
    mongodbContainer = await new MongoDBContainer("mongo:8")
      .withUsername(mongodbUsername)
      .withPassword(mongodbPassword)
      .withNetwork(network)
      .withNetworkAliases(mongodbNetworkAlias)
      .start()
    vaultContainer = await new VaultContainer("hashicorp/vault:1.20")
      .withVaultToken(token)
      .withNetwork(network)
      .withInitCommands(
        "secrets enable database",
        vaultConfigureMongoPluginCommand(vaultMongoConfigName, vaultMongoRole, mongodbNetworkAlias, mongodbUsername, mongodbPassword),
        vaultCreateRoleCommand(vaultMongoConfigName, vaultMongoRole)
      )
      .start()
  })

  after(async () => {
    await vaultContainer.stop()
    await mongodbContainer.stop()
    await network.stop()
  })

  test("should be able to not load anything by default", async (t) => {
    // Given
    const configSpec = c.config({
      schema: c.object({
        secret: c.secret().optional(),
        vault: vaultConfig
      }),
      sources: [
        envSource({loadSecrets: true}),
        vaultSource(),
      ]
    })

    // When
    const config = await configSpec.load({
      sources: {
        envs: {
          envs: {
            VAULT_ENDPOINT: vaultContainer.getAddress(),
            VAULT_TOKEN: token
          }
        }
      }
    })

    // Then
    assert.deepStrictEqual(config, {
      vault: {
        endpoint: vaultContainer.getAddress(),
        token
      }
    })
  })

  test("should be able to load static secrets", async (t) => {
    // Given
    const client = vault({
      apiVersion: "v1",
      token: vaultContainer.getRootToken()!,
      endpoint: vaultContainer.getAddress()
    })

    await client.write("secret/data/my-secret", {
      data: {
        foo: "bar"
      }
    })

    const configSpec = c.config({
      schema: c.object({
        secret: c.string().secret(),
        vault: vaultConfig
      }),
      sources: [
        envSource({loadSecrets: true}),
        vaultSource(),
      ]
    })

    // When
    const config = await configSpec.load({
      sources: {
        envs: {
          envs: {
            VAULT_ENDPOINT: vaultContainer.getAddress(),
            VAULT_TOKEN: token,
            SECRET: "%vault('secret/data/my-secret', 'foo')"
          }
        }
      },
    })

    // Then
    assert.deepStrictEqual(config, {
      vault: {endpoint: vaultContainer.getAddress(), token},
      secret: "bar"
    })
  })

  test("should be able to load dynamic secrets", {only: true}, async (t) => {
    // Given
    const clock = new FakeClock(Date.now())

    const configSpec = c.config({
      schema: c.object({
        creds: vaultDynamicSecret({
          username: c.string(),
          password: c.string()
        }),
        vault: vaultConfig
      }),
      sources: [
        envSource({loadSecrets: true}),
        vaultSource(),
      ]
    })

    // When
    const config = await configSpec.load({
      sources: {
        envs: {
          envs: {
            VAULT_ENDPOINT: vaultContainer.getAddress(),
            VAULT_TOKEN: token,
            CREDS: 'database/creds/my-role'
          }
        },
      },
      clock,
    })

    // Then
    expect(config).toMatchObject({
      vault: {endpoint: vaultContainer.getAddress(), token},
      creds: expect.objectContaining({
        expiresAt: new Date(clock.now() + 3600).getTime(),
        lease_duration: 3600,
        lease_id: expect.any(String),
        data: {
          username: expect.any(String),
          password: expect.any(String)
        },
        renewable: true,
        request_id: expect.any(String)
      })
    })
  })

  test("should be able to renew a dynamic secret", async (t) => {
    // Given
    const start = Date.now()
    const clock = new FakeClock(start)

    const configSpec = c.config({
      schema: c.object({
        creds: vaultDynamicSecret({
          username: c.string(),
          password: c.string()
        }),
        vault: vaultConfig
      }),
      sources: [
        envSource({loadSecrets: true}),
        vaultSource()
      ]
    })

    const config = await configSpec.load({
      sources: {
        envs: {
          envs: {
            VAULT_ENDPOINT: vaultContainer.getAddress(),
            VAULT_TOKEN: token,
            CREDS: 'database/creds/my-role'
          }
        },
      },
      clock
    })

    clock.add(1_000)

    // When
    await renewSecret(config.vault, config.creds, 120, clock)

    // Then
    expect(config).toMatchObject({
      creds: expect.objectContaining({
        lease_duration: 120,
        lease_id: expect.any(String),
        data: expect.objectContaining({
          username: expect.any(String),
          password: expect.any(String)
        }),
        renewable: true,
        request_id: expect.any(String),
        expiresAt: start + 1_000 + 120_000,
      })
    })
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
    const envs = envSource({prefix: "APP_"})

    const configSpec = c.config({
      schema: c.object({
        host: c.string()
      }),
      sources: [envs]
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
        envSource({loadSecrets: true})
      ]
    })

    // When
    const config = await configSpec.load({
      sources: {
        envs: {
          envs: {DBPASSWORD: "my-secret-db-password"}
        }
      }
    })

    // Then
    assert.deepStrictEqual(config, {dbPassword: "my-secret-db-password"})
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
        sources: [envs]
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
          envs: {
            envs: {PASSWORD: "my-pass"}
          }
        }
      })

      // Then
      assert.deepStrictEqual(config, {})
    })

    describe('coercion', function () {
      describe('boolean', function () {
        const scenarios = [
          ["true", true] as const,
          ["tRue", true] as const,
          ["false", false] as const,
          ["fAlSe", false] as const,
        ]

        for (const [input, expected] of scenarios) {
          test(`should be able to coerce '${input}' into '${expected}'`, async (t) => {
            // Given
            const envs = envSource()
            const configSpec = c.config({
              schema: c.object({
                enabled: c.boolean()
              }),
              sources: [envs]
            })

            // When
            const config = await configSpec.load({
              sources: {
                envs: {
                  envs: {ENABLED: input}
                }
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
          ["111", 111] as const,
          ["0", 0] as const,
          ["-34", -34] as const,
        ]

        for (const [input, expected] of scenarios) {
          test(`should be able to coerce '${input}' into '${expected}'`, async (t) => {
            // Given
            const envs = envSource()
            const configSpec = c.config({
              schema: c.object({
                value: c.integer()
              }),
              sources: [envs]
            })

            // When
            const config = await configSpec.load({
              sources: {
                envs: {
                  envs: {VALUE: input}
                }
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
          ["3.14", 3.14] as const,
          ["-3.14", -3.14] as const,
        ]

        for (const [input, expected] of scenarios) {
          test(`should be able to coerce '${input}' into '${expected}'`, async (t) => {
            // Given
            const envs = envSource()
            const configSpec = c.config({
              schema: c.object({
                value: c.float()
              }),
              sources: [envs]
            })

            // When
            const config = await configSpec.load({
              sources: {
                envs: {
                  envs: {VALUE: input}
                }
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
          sources: [envs]
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

      test("should be able to load a config from the normal key by default", async t => {
        // Given
        const envs = envSource()

        const configSpec = c.config({
          schema: c.object({
            host: c.string().aliases(envAlias("MY_SPECIAL_HOST"))
          }),
          sources: [envs]
        })

        // When
        const config = await configSpec.load({
          sources: {
            envs: {
              envs: {
                HOST: "localhost",
                MY_SPECIAL_HOST: "host.docker.internal"
              }
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
          .addFile("config.json", JSON.stringify({host: "%envs('ANOTHER_HOST_ENV_ENTRY')"}))

        const configSpec = c.config({
          schema: c.object({
            host: c.string()
          }),
          sources: [
            envSource(),
            fileSource({file: "config.json"})
          ]
        })

        // When
        const config = await configSpec.load({
          sources: {
            envs: {
              envs: {ANOTHER_HOST_ENV_ENTRY: "localhost"}
            },
            file: {fs}
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
          sources: [envs]
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
    })
  })

  describe('files', function () {
    test("should be able to load config from a json file", async (t) => {
      // Given
      const fs = new FakeFileSystem()
        .addFile("config.json", JSON.stringify({host: "localhost"}))

      const configSpec = c.config({
        schema: c.object({
          host: c.string()
        }),
        sources: [
          fileSource({file: "config.json"})
        ]
      })

      // When
      const config = await configSpec.load({
        sources: {
          file: {fs}
        }
      })

      // Then
      assert.deepStrictEqual(config, {host: "localhost"})
    })

    describe('validation', function () {
      test("should be able to validate config loaded from a file", async (t) => {
        // Given
        const fs = new FakeFileSystem()
          .addFile("config.json", JSON.stringify({port: "not-an-integer"}))

        const configSpec = c.config({
          schema: c.object({
            port: c.integer()
          }),
          sources: [
            fileSource({file: "config.json"})
          ]
        })

        // When
        const promise = configSpec.load({
          sources: {
            file: {fs}
          }
        })

        // Then
        await assert.rejects(promise, new ValidationError("port (file config.json) must be integer, got 'not-an-integer'"))
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
          envSource({loadSecrets: true}),
          vaultSource()
        ]
      })

      // When
      const config = await configSpec.load({
        sources: {
          envs: {
            envs: {
              VAULT_TOKEN: container.getRootToken(),
              VAULT_ENDPOINT: container.getAddress(),
              SECRET: "%vault('secret/data/secret', 'value')"
            },
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

function vaultConfigureMongoPluginCommand(
  configName: string,
  allowedRole: string,
  mongodbAlias: string,
  mongodbUsername: string,
  mongodbPassword: string
) {
  return `write database/config/${configName} plugin_name=mongodb-database-plugin allowed_roles="${allowedRole}" connection_url="mongodb://{{username}}:{{password}}@${mongodbAlias}:27017/admin?tls=false" username="${mongodbUsername}" password="${mongodbPassword}"`
}

function vaultCreateRoleCommand(configName: string, role: string) {
  /*vault write database/roles/my-role \
    db_name=my-mongodb-database \
    creation_statements='{ "db": "admin", "roles": [{ "role": "readWrite" }, {"role": "read", "db": "foo"}] }' \
    default_ttl="1h" \
    max_ttl="24h"*/

  return `write database/roles/my-role db_name=my-mongodb-database creation_statements='{ "db": "admin", "roles": [{ "role": "readWrite" }, {"role": "read", "db": "foo"}] }' default_ttl="1h" max_ttl="24h"`
}

