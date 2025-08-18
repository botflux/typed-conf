import {flatten, isSecret, object, type ObjectSchema, type ObjectSpec, secret, string} from "../schemes.js";
import type {Source} from "./source.js";
import vault from "node-vault"
import type {Static2} from "../c.js";
import {isIndirection, parseIndirection} from "../indirection.js";
import type {IndirectionEvaluator} from "../indirection/evaluator.js";
import type {IndirectionExpression} from "../indirection/compiler.js";
import type {EvaluatorFunction} from "../indirection/default-evaluator.js";

export const vaultConfig = object({
  endpoint: string(),
  token: secret()
})

export type VaultConfig = Static2<typeof vaultConfig>

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
    // const vaultConfig = extractVaultConfig(loaded)
    //
    // const vaultClient = vault({
    //   endpoint: vaultConfig.endpoint,
    //   token: vaultConfig.token,
    // })
    //
    // const secretEntries = flatten(schema)
    //   .filter(entry => isSecret(entry.value))
    //
    // const config = {}
    //
    // for (const entry of secretEntries) {
    //   const alreadyLoaded = getAtPath(loaded, entry.key)
    //
    //   if (typeof alreadyLoaded !== "string") {
    //     continue
    //   }
    //
    //   if (!isIndirection(alreadyLoaded)) {
    //     continue
    //   }
    //
    //   const indirection = parseIndirection(alreadyLoaded)
    //
    //   if (indirection.source !== "vault") {
    //     continue
    //   }
    //
    //   const [path] = indirection.args
    //
    //   if (path === undefined) {
    //     throw new Error("The vault secret's path is missing from the indirection expression.")
    //   }
    //
    //   const secret = await vaultClient.read(path)
    //
    //   let tmp = config
    //   const intermediateObjectPath = entry.key.slice(0, -1)
    //
    //   // Asserts intermediate objects are created.
    //   for (const chunk of intermediateObjectPath) {
    //     if (!(chunk in tmp)) {
    //       Object.defineProperty(tmp, chunk, {
    //         value: {},
    //         enumerable: true,
    //         configurable: true,
    //         writable: true
    //       })
    //     }
    //     // @ts-expect-error
    //     tmp = tmp[chunk]
    //   }
    //
    //   const key = entry.key.at(-1)
    //
    //   if (key === undefined) {
    //     throw new Error("key is undefined")
    //   }
    //
    //   Object.defineProperty(tmp, key, {
    //     value: secret,
    //     enumerable: true,
    //     configurable: true,
    //     writable: true
    //   })
    // }
    //
    // return config
  }

  getEvaluatorFunction(loaded: Record<string, unknown>, deps?: undefined): EvaluatorFunction {
    return {
      name: "vault",
      params: [
        {
          type: "string",
          name: "path"
        },
        {
          type: "string",
          name: "key"
        }
      ],
      fn: async args => {
        const { path, key } = args

        if (typeof path !== "string") {
          throw new Error(`Invalid argument "${path}" in vault.`)
        }

        if (typeof key !== "string") {
          throw new Error(`Invalid argument "${key}" in vault.`)
        }

        const secret = await this.loadSecret(path, loaded)
        return getAtPath(secret as Record<string, unknown>, [ "data", "data", key ])
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