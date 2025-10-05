import type {Source} from "./source.js";
import vault from "node-vault"
import {c, type Static} from "../loader.js";
import type {EvaluatorFunction} from "../indirection/default-evaluator.js";
import {string} from "../schemes/string.js";
import {secret} from "../schemes/secret.js";
import {object, type ObjectSchema, type ObjectSpec} from "../schemes/object.js";
import {ref} from "../schemes/ref.js";
import {Ajv} from "ajv";
import type {Clock} from "../clock/clock.interface.js";
import {NativeClock} from "../clock/native-clock.js";

export function vaultDynamicSecret<S extends ObjectSpec> (spec: S) {
  return ref(object({
    lease_duration: c.integer(),
    lease_id: c.string(),
    renewable: c.boolean(),
    request_id: c.string(),
    data: object(spec).secret(),
    expiresAt: c.integer(),
  }), "vault", ref => ({ path: ref }))
}

export type VaultDynamicSecret<T> = {
  lease_duration: number
  lease_id: string
  renewable: boolean
  request_id: string
  data: T
  expiresAt: number
}

type RenewResponse = {
  request_id: string
  lease_id: string
  renewable: boolean
  lease_duration: number
}

function validateRenewResponse (ajv: Ajv, response: unknown): asserts response is RenewResponse {
  const schema = {
    type: 'object',
    properties: {
      request_id: {
        type: 'string'
      },
      lease_id: {
        type: 'string'
      },
      renewable: {
        type: 'boolean'
      },
      lease_duration: {
        type: 'integer'
      }
    },
    required: [ 'request_id', 'lease_id', 'renewable', 'lease_duration' ]
  }

  const isValid = ajv.compile(schema)

  if (!isValid(response)) {
    throw new Error('Invalid renew response')
  }
}

export async function renewSecret<T>(config: VaultConfig, secret: VaultDynamicSecret<T>, increment: number, clock = new NativeClock()) {
  const client = vault({
    endpoint: config.endpoint,
    token: config.token,
  })

  const response = await client.renew({
    lease_id: secret.lease_id,
    increment
  }) as unknown

  validateRenewResponse(new Ajv(), response)

  secret.lease_duration = response.lease_duration
  secret.expiresAt = clock.now() + response.lease_duration * 1_000
  secret.request_id = response.request_id
  secret.lease_id = response.lease_id
}

export const vaultConfig = object({
  endpoint: string(),
  token: secret()
})

export type VaultConfig = Static<typeof vaultConfig>

export type VaultDeps = {
  clock?: Clock
}

class VaultSource implements Source<"vault", VaultDeps> {
  key: "vault" = "vault"
  #ajv = new Ajv()

  async loadSecret(path: string, loaded: Record<string, unknown>, deps?: VaultDeps) {
    const clock = deps?.clock ?? new NativeClock()
    const vaultConfig = extractVaultConfig(loaded)

    const client = vault({
        endpoint: vaultConfig.endpoint,
        token: vaultConfig.token,
    })

    const secret = await client.read(path) as unknown
    validateSecret(this.#ajv, secret);

    return Object.assign(secret, {
      expiresAt: clock.now() + secret.lease_duration,
    })

    // return secret
  }

  async load(schema: ObjectSchema<ObjectSpec>, loaded: Record<string, unknown>, deps?: VaultDeps): Promise<Record<string, unknown>> {
    return {}
  }

  getEvaluatorFunction(loaded: Record<string, unknown>, deps?: VaultDeps): EvaluatorFunction {
    return {
      name: "vault",
      params: [
        {
          type: "string",
          name: "path",
          required: true
        },
        {
          type: "string",
          name: "key",
          required: false
        }
      ],
      fn: async args => {
        const { path, key } = args

        if (typeof path !== "string") {
          throw new Error(`Invalid argument "${path}" in vault.`)
        }

        const secret = await this.loadSecret(path, loaded, deps)

        if (typeof key === "string") {
          return getAtPath(secret as Record<string, unknown>, [ "data", "data", key ])
        }

        return secret as Record<string, unknown>
      }
    }
  }
}

export function vaultSource(): Source<"vault", VaultDeps> {
  return new VaultSource()
}

function validateSecret(ajv: Ajv, secret: unknown): asserts secret is VaultDynamicSecret<unknown> {
  const schema = {
    type: 'object',
    properties: {
      lease_duration: {
        type: 'integer'
      },
      lease_id: {
        type: 'string'
      },
      renewable: {
        type: 'boolean'
      },
      request_id: {
        type: 'string'
      },
      data: {}
    },
  }

  const isValid = ajv.compile(schema)

  if (!isValid(secret)) {
    throw new Error('Invalid secret returned by vault')
  }
}

function getAtPath(loaded: Record<string, unknown>, path: string[]): unknown {
  let tmp: Record<string, unknown> = loaded

  const intermediateObjectPath = path.slice(0, -1)
  const key = path.at(-1)

  if (key === undefined) {
    throw new Error("Not implemented at line 46 in vault.ts")
  }

  for (const chunk of intermediateObjectPath) {
    if (typeof tmp !== "object" || tmp === null) {
      return undefined
    }

    if (!(chunk in tmp) || tmp[chunk] === undefined) {
      return undefined
    }

    tmp = tmp[chunk] as Record<string, unknown>
  }

  if (!(key in tmp) || tmp[key] === undefined) {
    return undefined
  }

  return tmp[key]
}

function extractVaultConfig(loaded: Record<string, unknown>): VaultConfig {
  if (!("vault" in loaded)) {
    throw new Error("vault config not found")
  }

  if (typeof loaded.vault !== "object") {
    throw new Error("vault config is not an object")
  }

  if (loaded.vault === null) {
    throw new Error("vault config is null")
  }

  if (!("token" in loaded.vault)) {
    throw new Error("vault token not found")
  }

  if (typeof loaded.vault.token !== "string") {
    throw new Error("vault token is not a string")
  }

  if (!("endpoint" in loaded.vault)) {
    throw new Error("vault endpoint not found")
  }

  if (typeof loaded.vault.endpoint !== "string") {
    throw new Error("vault endpoint is not a string")
  }

  return {
    endpoint: loaded.vault.endpoint,
    token: loaded.vault.token
  }
}