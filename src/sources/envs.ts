import type {Source} from "./source.js";
import {
  type Alias,
  type BaseSchema,
  flatten,
  type ObjectSchema,
  type ObjectSpec,
  type SecretSchema
} from "../schemes.js";

export type EnvSourceOpts = {
  /**
   * Specify a global env name prefix.
   * By default, there is no prefix.
   *
   * @default {""}
   */
  prefix?: string

  /**
   * True if you want the secrets to be loaded from env variables.
   * By default, secrets are not loaded from env variables.
   *
   * @default {false}
   */
  loadSecrets?: boolean
}

class EnvSource implements Source<"envs", NodeJS.ProcessEnv> {
  key: "envs" = "envs" as const

  #opts: Required<EnvSourceOpts>

  constructor(config: Required<EnvSourceOpts>) {
    this.#opts = config
  }

  async load(schema: ObjectSchema<ObjectSpec>, loaded: Record<string, unknown>, envs: NodeJS.ProcessEnv = process.env): Promise<Record<string, unknown>> {
    const entries = flatten(schema)

    const filteredEntries = !this.#opts.loadSecrets
      ? entries.filter(e => !isSecret(e.value))
      : entries

    const config = {}

    for (const entry of filteredEntries) {
      const envAliases = entry.value._aliases.filter(a => a.sourceKey === "envs")
      const defaultEnvKey = [this.#opts.prefix, entry.key.join("_").toUpperCase()].join("")
      const allEnvKeys = [defaultEnvKey, ...envAliases.map(a => a.id)]

      let envValue = undefined

      for (const envKey of allEnvKeys) {
        if (envs[envKey] !== undefined) {
          envValue = envs[envKey]
          break
        }
      }

      if (envValue === undefined) {
        continue
      }

      let tmp = config
      const intermediateObjectPath = entry.key.slice(0, -1)

      // Asserts intermediate objects are created.
      for (const chunk of intermediateObjectPath) {
        if (!(chunk in tmp)) {
          Object.defineProperty(tmp, chunk, {
            value: {},
            enumerable: true,
            configurable: true,
            writable: true
          })
        }
        // @ts-expect-error
        tmp = tmp[chunk]
      }

      const key = entry.key.at(-1)

      if (key === undefined) {
        throw new Error("key is undefined")
      }

      Object.defineProperty(tmp, key, {
        value: entry.value.coerce?.(envValue) ?? envValue,
        enumerable: true,
        configurable: true,
        writable: true
      })
    }

    return Promise.resolve(config)
  }
}

export function envSource(opts: EnvSourceOpts = {}): Source<"envs", NodeJS.ProcessEnv> {
  const {prefix = "", loadSecrets = false} = opts

  return new EnvSource({ prefix, loadSecrets })
}

export function envAlias(id: string): Alias {
  return {
    id,
    sourceKey: "envs"
  }
}

function isSecret(schema: BaseSchema<unknown>): schema is SecretSchema {
  return "type" in schema && schema.type === "secret"
}