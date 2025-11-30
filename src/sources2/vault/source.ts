import type {LoadableFromParams, LoadResult} from "../source.js";
import type {InjectOpts, NormalizedVaultSecret, Params, VaultOpts, VaultResponse} from "./types.js";
import {AjvValidator} from "../../validation2/validator.js";
import {type BaseSchema, getSchemaAtPath, kType} from "../../schemes2/base.js";
import vault from "node-vault";
import {isVaultConfig, vaultReadResponseSchema} from "./schemes.js";
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
      endpoint: vaultConfig.endpoint,
      ...'token' in vaultConfig.auth && {token: vaultConfig.auth.token}
    })

    if ('userpass' in vaultConfig.auth) {
      // vaultClient.userpassLogin(vaultConfig.auth.userpass.username, vaultConfig.auth.userpass.password)
      const result = await vaultClient.userpassLogin({
        username: vaultConfig.auth.userpass.username,
        password: vaultConfig.auth.userpass.password
      })

      vaultClient.token = result.auth.client_token
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
}

export function vaultSource(opts: VaultOpts = {}) {
  return new VaultSource(opts)
}
