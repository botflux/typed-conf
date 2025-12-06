import type {LoadableFromParams, LoadResult} from "../source.js";
import type {InjectOpts, NormalizedVaultSecret, Params, VaultOpts, VaultResponse} from "./types.js";
import {AjvValidator} from "../../validation2/validator.js";
import {type BaseSchema, getSchemaAtPath, kType} from "../../schemes/base.js";
import vault, { type client as Client } from "node-vault";
import {isVaultConfig, vaultAuthResponseSchema, vaultConfig, vaultReadResponseSchema} from "./schemes.js";
import {getTypeSafeValueAtPathFactory} from "../../validation2/utils.js";
import {inlineCatch} from "../../utils.js";
import {Ajv, type Schema} from "ajv";

class VaultSource implements LoadableFromParams<InjectOpts, Params> {
  #validator = new AjvValidator()
  #opts: VaultOpts

  constructor(opts: VaultOpts) {
    this.#opts = opts;
  }

  async loadFromParams(params: Params, schema: BaseSchema<unknown>, opts: InjectOpts, previous: Record<string, unknown>): Promise<LoadResult> {
    const {path} = params
    const {createVaultClient = vault} = opts
    const {configKey = "vault"} = this.#opts

    const vaultConfigSchema = getSchemaAtPath(schema, [configKey])

    if (vaultConfigSchema === undefined) {
      throw new Error(`There is no schema at path "${configKey}". You must add a "${configKey}" property, of type vaultConfig, to your config schema to use vault sources.`)
    }

    if (!isVaultConfig(vaultConfigSchema)) {
      throw new Error(`Schema at property "${configKey}" must be a vaultConfig`)
    }

    const getTypeSafeValueAtPath = getTypeSafeValueAtPathFactory(this.#validator)
    const vaultConfig = getTypeSafeValueAtPath(previous, [configKey], vaultConfigSchema)

    const vaultClient = createVaultClient({
      apiVersion: 'v1',
      endpoint: vaultConfig.endpoint,
      ...'token' in vaultConfig.auth && {token: vaultConfig.auth.token}
    })

    if (!('token' in vaultConfig.auth)) {
      vaultClient.token = await this.#authenticate(vaultClient, vaultConfig.auth)
    }

    const [mSecret, err] = await inlineCatch(vaultClient.read(path) as Promise<VaultResponse>)

    if (err !== undefined && this.#isVault404(err)) {
      throw new Error(`Vault secret '${path}' does not exist`)
    }

    if (err !== undefined) {
      throw err
    }

    const ajv = new Ajv()
    const isValid = ajv.compile(vaultReadResponseSchema.jsonSchema as Schema)

    if (!isValid(mSecret)) {
      throw new AggregateError(
        isValid.errors?.map(e => new Error(e.message)) ?? [],
        `Vault response failed validation when reading "${path}"`
      )
    }

    const normalizedSecret = this.#toNormalizedVaultSecret(mSecret as typeof vaultReadResponseSchema[typeof kType])

    return {
      type: 'non_mergeable',
      value: normalizedSecret,
      origin: `vault:${path}`
    }
  }

  areValidParams(params: Record<string, unknown>): params is Params {
    throw new Error('Method not implemented.');
  }

  #isVault404(err: unknown) {
    return err instanceof Error && err.message === "Status 404"
  }

  #toNormalizedVaultSecret(secret: typeof vaultReadResponseSchema[typeof kType]): NormalizedVaultSecret {
    const {
      request_id,
      mount_type,
      lease_id,
      data,
      renewable,
      lease_duration
    } = secret

    const baseSecret = {
      requestId: request_id,
      mountType: mount_type,
      data,
    }

    if (lease_id !== "") {
      return {
        ...baseSecret,
        leaseId: lease_id,
        leaseDuration: lease_duration,
        renewable,
        type: 'dynamic'
      }
    } else {
      return {
        ...baseSecret,
        type: 'static'
      }
    }
  }

  async #authenticate(client: Client, config: typeof vaultConfig[typeof kType]['auth']) {
    const tokenResponse = await this.#getTokenResponse(client, config)
    const ajv = new Ajv()

    const isValid = ajv.compile(vaultAuthResponseSchema.jsonSchema as Schema)

    if (!isValid(tokenResponse)) {
      throw new Error("Not implemented at line 129 in source.ts")
    }

    return (tokenResponse as typeof vaultAuthResponseSchema[typeof kType]).auth.client_token
  }

  async #getTokenResponse(client: Client, config: typeof vaultConfig[typeof kType]['auth']) {
    if ('userpass' in config) {
      return await client.userpassLogin({
        username: config.userpass.username,
        password: config.userpass.password
      })
    }

    if ('kubernetes' in config) {
      return await client.request({
        method: 'POST',
        path: '/auth/kubernetes/login',
        json: {
          role: config.kubernetes.role,
          jwt: config.kubernetes.jwt
        }
      })
    }

    throw new Error("Not implemented at line 133 in source.ts")
  }
}

export function vaultSource(opts: VaultOpts = {}) {
  return new VaultSource(opts)
}
