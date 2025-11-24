import {after, before, describe, it} from 'node:test'
import {expect} from "expect";
import vault from 'node-vault'
import {type StartedVaultContainer, VaultContainer} from "@testcontainers/vault";
import type {LoadableFromParams, LoadResult} from "../source.js";
import {type BaseSchema, getSchemaAtPath} from '../../schemes2/base.js';
import {object} from "../../schemes2/object.js";
import {getTypeSafeValueAtPathFactory} from "../../validation2/utils.js";
import {AjvValidator} from "../../validation2/validator.js";
import {isVaultConfig, vaultConfig} from "./schemes.js";
import type {VaultResponse} from "./types.js";
import {randomUUID} from "node:crypto";
import {inlineCatch} from "../../utils.js";

export type VaultOpts = {
  configKey?: string
}
export type Params = {
  path: string
}

class VaultSource implements LoadableFromParams<VaultOpts, Params> {
  #validator = new AjvValidator()

  async loadFromParams(params: Params, schema: BaseSchema<unknown>, opts: VaultOpts, previous: Record<string, unknown>): Promise<LoadResult> {
    const { path } = params
    const { configKey = "vault" } = opts

    const vaultConfigSchema = getSchemaAtPath(schema, [ configKey ])
    
    if (vaultConfigSchema === undefined) {
      throw new Error("Not implemented at line 28 in vault.unit.ts")
    }
    
    if (!isVaultConfig(vaultConfigSchema)) {
      throw new Error("Not implemented at line 33 in vault.unit.ts")
    }

    const getTypeSafeValueAtPath = getTypeSafeValueAtPathFactory(this.#validator)
    const vaultConfig = getTypeSafeValueAtPath(previous, [ configKey ], vaultConfigSchema)

    const vaultClient = vault({
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

function vaultSource() {
  return new VaultSource()
}

describe('vaultSource', {skip: false}, function () {
  let container!: StartedVaultContainer
  let client!: ReturnType<typeof vault>

  before(async () => {
    container = await new VaultContainer('hashicorp/vault:latest')
      .withVaultToken('root')
      .start()
    client = vault({
      apiVersion: 'v1',
      endpoint: container.getAddress(),
      token: container.getRootToken()!
    })
  })

  after(async () => {
    await container.stop()
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
        endpoint: container.getAddress(),
        auth: {
          token: container.getRootToken()!
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
        endpoint: container.getAddress(),
        auth: {
          token: container.getRootToken()!
        }
      }
    })
      .catch(e => e)

    // Then
    expect(secret).toEqual(new Error(`Vault secret 'secret/data/${secretId}' does not exist`))
  })
})