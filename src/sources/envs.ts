import type {Source} from "./source.js";
import {
  type Alias,
  type BaseSchema,
  flatten,
  type ObjectSchema,
  type ObjectSpec,
  type SecretSchema
} from "../schemes.js";
import type {IndirectionEvaluator} from "../indirection/evaluator.js";
import type {IndirectionExpression} from "../indirection/compiler.js";
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

class EnvIndirectionEvaluator implements IndirectionEvaluator {
  #source: EnvSource
  #envs: NodeJS.ProcessEnv

  constructor(source: EnvSource, envs: NodeJS.ProcessEnv) {
    this.#source = source;
    this.#envs = envs;
  }

  evaluate(indirection: IndirectionExpression): Promise<unknown> {
    const { source, namedArgs = {}, args: positionalArgs } = indirection

    if (source !== "envs") {
      throw new Error(`EnvIndirectionEvaluator can only evaluate envs indirections, received ${source} indirection instead.`)
    }

    if (Object.keys(namedArgs ?? {}).length === 0 && positionalArgs.length === 0) {
      throw new Error("An env expression must have at least one argument. You can either pass it as a positional argument " +
        "(e.g. `%env('MY_ENV')`) or using a named argument (e.g. `%env(key='MY_ENV')`).")
    }

    const envKey = Object.keys(namedArgs).length > 0
      ? this.#getEnvKeyFromNamed(namedArgs)
      : this.#getEnvKeyFromPositional(positionalArgs)


    const mEnvValue = this.#source.loadByKey(envKey, this.#envs)

    if (mEnvValue === undefined) {
      throw new Error(`Env variable ${envKey} is not defined.`)
    }

    return Promise.resolve(mEnvValue)
  }

  supports(indirection: IndirectionExpression): boolean {
    return indirection.source === "envs"
  }

  #getEnvKeyFromNamed(namedArgs: Record<string, unknown>): string {
    if (!("key" in namedArgs)) {
      throw new Error(
        `Env indirections must have a "key" argument, but received ${Object.keys(namedArgs).join(", ")} instead.`
      )
    }

    const key = namedArgs.key

    if (typeof key !== "string") {
      throw new Error(`Env indirections must have a "key" argument that is a string, but received ${typeof key} instead.`)
    }

    return key
  }

  #getEnvKeyFromPositional(positionalArgs: string[]): string {
    if (positionalArgs.length !== 1) {
      throw new Error(`Env indirections can only have one positional argument, but received ${positionalArgs.length}. The only accepted argument is the env name (e.g. \`%env('MY_ENV')\`).`)
    }

    return positionalArgs[0]!
  }
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

  getEvaluator(envs: NodeJS.ProcessEnv = process.env): IndirectionEvaluator {
    return new EnvIndirectionEvaluator(this, envs)
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