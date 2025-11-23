import {after, before, describe, it} from 'node:test'
import {expect} from "expect";
import vault from 'node-vault'
import {type StartedVaultContainer, VaultContainer} from "@testcontainers/vault";
import type {LoadableFromParams, LoadResult} from "../source.js";
import type {BaseSchema} from '../../schemes2/base.js';
import {object} from "../../schemes2/object.js";

export type VaultOpts = {
  configKey?: string
}
export type Params = {
  path: string
}

class VaultSource implements LoadableFromParams<VaultOpts, Params> {
  async loadFromParams(params: Params, schema: BaseSchema<unknown>, opts: VaultOpts, previous: Record<string, unknown>): Promise<LoadResult> {
    const { path } = params
    const { configKey = "vault" } = opts

    throw new Error('Method not implemented.');
  }

  areValidParams(params: Record<string, unknown>): params is Params {
    throw new Error('Method not implemented.');
  }
}

function vaultSource() {
  return new VaultSource()
}

describe('vaultSource', {skip: true}, function () {
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
    await client.write('secret/data/foo', {
      data: {username: 'admin', password: 'pass'}
    })

    const source = vaultSource()

    // When
    const secret = await source.loadFromParams({path: 'secret/data/foo'}, object({}), {}, {
      vault: {
        data: {
          endpoint: container.getAddress(),
          auth: {
            token: container.getRootToken()!
          }
        }
      }
    })

    // Then
    expect(secret).toEqual({
      type: 'non_mergeable',
      value: {
        data: {username: 'admin', password: 'pass'}
      },
      origin: 'vault:secret/data/foo'
    })
  })
})