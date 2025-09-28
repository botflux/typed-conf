import type {Source} from "./source.js";
import vault from "node-vault"
import {c, type Static} from "../loader.js";
import type {EvaluatorFunction} from "../indirection/default-evaluator.js";
import {string} from "../schemes/string.js";
import {secret} from "../schemes/secret.js";
import {object, type ObjectSchema, type ObjectSpec} from "../schemes/object.js";
import {ref} from "../schemes/ref.js";

export function vaultDynamicSecret<S extends ObjectSpec> (spec: S) {
  return ref(object({
    lease_duration: c.integer(),
    lease_id: c.string(),
    renewable: c.boolean(),
    request_id: c.string(),
    data: object(spec).secret()
  }), "vault", ref => ({ path: ref }))
  
  // return object({
  //   lease_duration: c.integer(),
  //   lease_id: c.string(),
  //   renewable: c.boolean(),
  //   request_id: c.string(),
  //   data: object(spec).secret()
  // })
}

export const vaultConfig = object({
  endpoint: string(),
  token: secret()
})

export type VaultConfig = Static<typeof vaultConfig>

class VaultSource implements Source<"vault", undefined> {
  key: "vault" = "vault"

  async loadSecret(path: string, loaded: Record<string, unknown>) {
    const vaultConfig = extractVaultConfig(loaded)

    const client = vault({
        endpoint: vaultConfig.endpoint,
        token: vaultConfig.token,
    })

    return await client.read(path) as unknown
  }

  async load(schema: ObjectSchema<ObjectSpec>, loaded: Record<string, unknown>, deps: undefined): Promise<Record<string, unknown>> {
    return {}
  }

  getEvaluatorFunction(loaded: Record<string, unknown>, deps?: undefined): EvaluatorFunction {
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

        const secret = await this.loadSecret(path, loaded)

        if (typeof key === "string") {
          return getAtPath(secret as Record<string, unknown>, [ "data", "data", key ])
        }

        return secret as Record<string, unknown>
      }
    }
  }
}

export function vaultSource(): Source<"vault", undefined> {
  return new VaultSource()
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