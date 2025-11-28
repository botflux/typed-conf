import {after, before, describe, it, mock} from 'node:test'
import {expect} from "expect";
import vault, {type client} from 'node-vault'
import {type StartedVaultContainer, VaultContainer} from "@testcontainers/vault";
import type {LoadableFromParams, LoadResult} from "../source.js";
import {type BaseSchema, getSchemaAtPath, kType} from '../../schemes2/base.js';
import {object} from "../../schemes2/object.js";
import {getTypeSafeValueAtPathFactory} from "../../validation2/utils.js";
import {AjvValidator} from "../../validation2/validator.js";
import {isVaultConfig, vaultConfig} from "./schemes.js";
import type {VaultResponse} from "./types.js";
import {randomUUID} from "node:crypto";
import {inlineCatch} from "../../utils.js";
import {string} from "../../schemes2/string.js";
import {MongoDBContainer, type StartedMongoDBContainer} from "@testcontainers/mongodb";
import {Network, type StartedNetwork} from "testcontainers";

export type VaultOpts = {
  configKey?: string
}

export type InjectOpts = {
  createVaultClient?: typeof vault
}

export type Params = {
  path: string
}

type ExtractSecret<S extends BaseSchema<unknown>> = {
  schema: S
  map: (value: S[typeof kType]) => unknown
}

const defaultSecretExtract = new Map<string, ExtractSecret<BaseSchema<unknown>>>()
  .set('kv', {
    schema: object({
      data: object({
        data: object({}, { additionalProperties: true })
      })
    }),
    map: value => value
  })


class VaultSource implements LoadableFromParams<InjectOpts, Params> {
  #validator = new AjvValidator()
  #opts: VaultOpts

  constructor(opts: VaultOpts) {
    this.#opts = opts;
  }

  async loadFromParams(params: Params, schema: BaseSchema<unknown>, opts: InjectOpts, previous: Record<string, unknown>): Promise<LoadResult> {
    const { path } = params
    const { createVaultClient = vault } = opts
    const { configKey = "vault" } = this.#opts

    const vaultConfigSchema = getSchemaAtPath(schema, [ configKey ])
    
    if (vaultConfigSchema === undefined) {
      throw new Error(`There is no schema at path "${configKey}". You must add a "${configKey}" property, of type vaultConfig, to your config schema to use vault sources.`)
    }
    
    if (!isVaultConfig(vaultConfigSchema)) {
      throw new Error(`Schema at property "${configKey}" must be a vaultConfig`)
    }

    const getTypeSafeValueAtPath = getTypeSafeValueAtPathFactory(this.#validator)
    const vaultConfig = getTypeSafeValueAtPath(previous, [ configKey ], vaultConfigSchema)

    const vaultClient = createVaultClient({
      endpoint: vaultConfig.endpoint,
      token: vaultConfig.auth.token
    })

    const [mSecret, err] = await inlineCatch(vaultClient.read(path) as Promise<VaultResponse>)

    if (err !== undefined && this.#isVault404(err)) {
      throw new Error(`Vault secret '${path}' does not exist`)
    }

    if (err !== undefined) {
      throw err
    }

    console.log('secret', mSecret)

    return {
      type: 'non_mergeable',
      value: {
        data: mSecret!.data.data,
        metadata: mSecret!.data.metadata,
        type: 'static'
      },
      origin: `vault:${path}`
    }
  }

  areValidParams(params: Record<string, unknown>): params is Params {
    throw new Error('Method not implemented.');
  }

  #isVault404(err: unknown) {
    return err instanceof Error && err.message === "Status 404"
  }
}

function vaultSource(opts: VaultOpts = {}) {
  return new VaultSource(opts)
}

describe('vaultSource', { skip: true }, function () {

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
        data: {username: 'admin', password: 'pass'},
        metadata: response.data,
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
    const source = vaultSource({ configKey: 'myVault' })
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
        data: {username: 'admin', password: 'pass'},
        metadata: secret.data,
        type: 'static'
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
      vault: object({ foo: string()})
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
        metadata: {},
        type: 'dynamic'
      },
      origin: 'vault:database/creds/my-role'
    })
  })

  it('should be able to throw given vault\'s response doesn\'t match the expected response schema', { skip: true }, async function () {
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
    }, {}).catch(e => e)

    // Then
    expect(error).toEqual(new Error(`Vault response validation failed when reading "secret/data/foo"`, {
      cause: new Error('foo')
    }))
  })
})