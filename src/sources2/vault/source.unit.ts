import {after, before, describe, it} from 'node:test'
import {expect} from "expect";
import vault, {type client} from 'node-vault'
import {type StartedVaultContainer, VaultContainer} from "@testcontainers/vault";
import {object} from "../../schemes2/object.js";
import {vaultConfig} from "./schemes.js";
import {randomUUID} from "node:crypto";
import {string} from "../../schemes2/string.js";
import {MongoDBContainer, type StartedMongoDBContainer} from "@testcontainers/mongodb";
import {Network, type StartedNetwork} from "testcontainers";
import {vaultSource} from "./source.js";

describe('vaultSource', function () {
  const mongoUsername = "test"
  const mongoPassword = "testpass"
  const mongoNetworkAlias = "mongo"

  const mongodbConfigName = "mongodb"
  const mongoVaultRole = "my-role"

  let network!: StartedNetwork

  let mongoContainer!: StartedMongoDBContainer
  let vaultContainer!: StartedVaultContainer
  let client!: ReturnType<typeof vault>

  before(async () => {
    network = await new Network().start()

    mongoContainer = await new MongoDBContainer('mongo:8')
      .withUsername(mongoUsername)
      .withPassword(mongoPassword)
      .withNetwork(network)
      .withNetworkAliases(mongoNetworkAlias)
      .start()

    vaultContainer = await new VaultContainer('hashicorp/vault:latest')
      .withVaultToken('root')
      .withNetwork(network)
      .withInitCommands(
        "auth enable userpass",
        "secrets enable database",
        `write database/config/${mongodbConfigName} plugin_name=mongodb-database-plugin allowed_roles="${mongoVaultRole}" connection_url="mongodb://{{username}}:{{password}}@${mongoNetworkAlias}:27017/admin?tls=false" username="${mongoUsername}" password="${mongoPassword}"`,
        `write database/roles/${mongoVaultRole} db_name=${mongodbConfigName} creation_statements='{ "db": "admin", "roles": [{ "role": "readWrite" }, {"role": "read", "db": "foo"}] }' default_ttl="1h" max_ttl="24h"`
      )
      .start()

    client = vault({
      apiVersion: 'v1',
      endpoint: vaultContainer.getAddress(),
      token: vaultContainer.getRootToken()!
    })
  })

  after(async () => {
    await vaultContainer.stop()
    await mongoContainer.stop()
    await network.stop()
  })

  it('should be able to load a static secret from vault', async function () {
    // Given
    const response = await client.write('secret/data/foo', {
      data: {username: 'admin', password: 'pass'}
    }) as Record<string, unknown>

    const source = vaultSource()
    const schema = object({
      vault: vaultConfig
    })

    // When
    const secret = await source.loadFromParams({path: 'secret/data/foo'}, schema, {}, {
      vault: {
        endpoint: vaultContainer.getAddress(),
        auth: {
          token: vaultContainer.getRootToken()!
        }
      }
    })

    // Then
    expect(secret).toEqual({
      type: 'non_mergeable',
      value: {
        data: {
          data: {username: 'admin', password: 'pass'},
          metadata: response.data,
        },
        requestId: expect.any(String),
        mountType: 'kv',
        type: 'static'
      },
      origin: 'vault:secret/data/foo'
    })
  })

  it('should be able to throw given the secret does not exist', async function () {
    // Given
    const secretId = randomUUID()
    const source = vaultSource()
    const schema = object({
      vault: vaultConfig
    })

    // When
    const secret = await source.loadFromParams({path: `secret/data/${secretId}`}, schema, {}, {
      vault: {
        endpoint: vaultContainer.getAddress(),
        auth: {
          token: vaultContainer.getRootToken()!
        }
      }
    })
      .catch(e => e)

    // Then
    expect(secret).toEqual(new Error(`Vault secret 'secret/data/${secretId}' does not exist`))
  })

  it('should be able to configure the vault config', async function () {
    // Given
    const randomId = randomUUID()
    const secret = await client.write(`secret/data/${randomId}`, {
      data: {
        username: 'admin',
        password: 'pass'
      }
    })
    const source = vaultSource({configKey: 'myVault'})
    const schema = object({
      myVault: vaultConfig
    })

    // When
    const result = await source.loadFromParams({path: `secret/data/${randomId}`}, schema, {}, {
      myVault: {
        endpoint: vaultContainer.getAddress(),
        auth: {
          token: vaultContainer.getRootToken()!
        }
      }
    })

    // Then
    expect(result).toEqual({
      type: 'non_mergeable',
      value: {
        data: {
          data: {
            username: 'admin', password: 'pass'
          },
          metadata: secret.data
        },
        type: 'static',
        mountType: 'kv',
        requestId: expect.any(String)
      },
      origin: `vault:secret/data/${randomId}`
    })
  })

  it('should be able to throw given there is no vault config schema at the given path', async function () {
    // Given
    const source = vaultSource()
    const schema = object({
      foo: vaultConfig
    })

    // When
    const error = await source.loadFromParams({path: 'secret/data/foo'}, schema, {}, {})
      .catch(e => e)

    // Then
    expect(error).toEqual(new Error('There is no schema at path "vault". You must add a "vault" property, of type vaultConfig, to your config schema to use vault sources.'))
  })

  it('should be able to throw given the schema at the vault property is not a vault config', async function () {
    // Given
    const source = vaultSource()
    const schema = object({
      vault: object({foo: string()})
    })

    // When
    const error = await source.loadFromParams({path: 'secret/data/foo'}, schema, {}, {})
      .catch(e => e)

    // Then
    expect(error).toEqual(new Error('Schema at property "vault" must be a vaultConfig'))
  })

  it('should be able to load a dynamic secret', async function () {
    // Given
    const source = vaultSource()
    const schema = object({
      vault: vaultConfig
    })

    // When
    const secret = await source.loadFromParams({path: `database/creds/${mongoVaultRole}`}, schema, {}, {
      vault: {
        endpoint: vaultContainer.getAddress(),
        auth: {
          token: vaultContainer.getRootToken()!
        }
      }
    })

    // Then
    expect(secret).toEqual({
      type: 'non_mergeable',
      value: {
        data: {
          username: expect.any(String),
          password: expect.any(String)
        },
        type: 'dynamic',
        leaseDuration: 3600,
        leaseId: expect.stringMatching('database/creds/my-role'),
        mountType: 'database',
        requestId: expect.any(String),
        renewable: true
      },
      origin: 'vault:database/creds/my-role'
    })
  })

  it('should be able to throw given vault\'s response doesn\'t match the expected response schema', async function () {
    // Given
    const vaultClient = {
      read() {
        return {
          foo: 'bar'
        }
      }
    } as unknown as client
    const source = vaultSource()
    const schema = object({
      vault: vaultConfig
    })

    // When
    const error = await source.loadFromParams({path: 'secret/data/foo'}, schema, {
      createVaultClient: () => vaultClient
    }, {
      vault: {
        endpoint: vaultContainer.getAddress(),
        auth: {
          token: vaultContainer.getRootToken()!
        }
      }
    }).catch(e => e)

    // Then
    expect(error).toEqual(new AggregateError([], `Vault response failed validation when reading "secret/data/foo"`))
    expect((error as AggregateError).errors).toEqual([
      new Error("must have required property 'request_id'")
    ])
  })

  it('should be able to authenticate using user and password', async function () {
    // Given
    const randomId = randomUUID()

    const source = vaultSource()
    const schema = object({
      vault: vaultConfig
    })

    await client.addPolicy({
      name: `my-policy-${randomId}`,
      rules: `
        path "secret/data/${randomId}/*" {
          capabilities = ["read", "list"]
        }
      `
    })

    await client.write(`auth/userpass/users/test${randomId}`, {
      password: '<PASSWORD>',
      policies: [`my-policy-${randomId}`]
    })

    const result = await client.write(`secret/data/${randomId}/foo`, {
      data: {username: 'admin', password: 'pass'}
    })

    // When
    const secret = await source.loadFromParams({path: `secret/data/${randomId}/foo`}, schema, {}, {
      vault: {
        endpoint: vaultContainer.getAddress(),
        auth: {
          userpass: {
            username: `test${randomId}`,
            password: '<PASSWORD>'
          }
        }
      }
    })

    // Then
    expect(secret).toEqual({
      type: 'non_mergeable',
      value: {
        data: {
          data: {username: 'admin', password: 'pass'},
          metadata: result.data
        },
        type: 'static',
        mountType: 'kv',
        requestId: expect.any(String),
      },
      origin: `vault:secret/data/${randomId}/foo`,
    })
  })
})