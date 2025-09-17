import type {Source, SourceValue, ConfigWithMetadata} from "./source.js";
import {
  type Alias,
  type BaseSchema,
  flatten,
  type ObjectSchema,
  type ObjectSpec,
  type SecretSchema
} from "../schemes.js";
import type {EvaluatorFunction} from "../indirection/default-evaluator.js";

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

  async load(schema: ObjectSchema<ObjectSpec>, loaded: ConfigWithMetadata, envs: NodeJS.ProcessEnv = process.env): Promise<ConfigWithMetadata> {
    const entries = flatten(schema)

    const filteredEntries = !this.#opts.loadSecrets
      ? entries.filter(e => !isSecret(e.value))
      : entries

    const config = {}

    for (const entry of filteredEntries) {
      const envAliases = entry.value.aliases.filter(a => a.sourceKey === "envs")
      const defaultEnvKey = [this.#opts.prefix, entry.key.join("_").toUpperCase()].join("")
      const allEnvKeys = [defaultEnvKey, ...envAliases.map(a => a.id)]

      let envValue = undefined
      let usedEnvKey = undefined

      for (const envKey of allEnvKeys) {
        if (envs[envKey] !== undefined) {
          envValue = envs[envKey]
          usedEnvKey = envKey
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

      const sourceValue: SourceValue = {
        value: entry.value.coerce?.(envValue) ?? envValue,
        source: "env",
        originalNameInSource: usedEnvKey!
      }

      Object.defineProperty(tmp, key, {
        value: sourceValue,
        enumerable: true,
        configurable: true,
        writable: true
      })
    }

    return Promise.resolve(config)
  }

  getEvaluatorFunction(loaded: Record<string, unknown>, deps: NodeJS.ProcessEnv = process.env): EvaluatorFunction {
    return {
      name: "envs",
      params: [
        {
          name: "key",
          type: "string"
        }
      ],
      fn: args => {
        const key = args.key

        if (typeof key !== "string") {
          throw new Error(`Env indirections must have a "key" argument that is a string, but received ${typeof key} instead.`)
        }

        return this.loadByKey(key, deps)
      }
    }
  }

  loadByKey(envKey: string, envs: NodeJS.ProcessEnv): string | undefined {
    return envs[envKey]
  }
}

export function envSource(opts: EnvSourceOpts = {}): Source<"envs", NodeJS.ProcessEnv> {
  const {prefix = "", loadSecrets = false} = opts

  return new EnvSource({prefix, loadSecrets})
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