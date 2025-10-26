import type {BaseDeps, Source} from "../source.js";
import type {EvaluatorFunction} from "../../indirection/default-evaluator.js";
import {setValueAtPath} from "../../utils.js";
import {type Alias, type BaseSchema, type Entry, flatten} from "../../schemes/base.js";
import type {ObjectSchema, ObjectSpec} from "../../schemes/object.js";
import {AjvSchemaValidator} from "../../validation/ajv.js";
import type {JSONSchema} from "json-schema-to-typescript";

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

export type EnvDeps = BaseDeps & {
  envs?: NodeJS.ProcessEnv
}

class EnvSource implements Source<"envs", EnvDeps> {
  key: "envs" = "envs" as const

  #opts: Required<EnvSourceOpts>
  #validator = new AjvSchemaValidator()

  constructor(config: Required<EnvSourceOpts>) {
    this.#opts = config
  }

  async load(schema: ObjectSchema<ObjectSpec>, loaded: Record<string, unknown>, deps: EnvDeps): Promise<Record<string, unknown>> {
    const { envs = process.env } = deps
    const entries = flatten(schema)
    const [ rawEnvs, jsonSchemes, schemes ] = this.#loadConfigFromEnvs(entries, envs)

    this.#validator.validate({
      type: "object",
      properties: Object.fromEntries(jsonSchemes.entries()),
      required: [],
      additionalProperties: false
    }, Object.fromEntries(rawEnvs.entries()), this.key)

    const config = this.#envsToRecord(rawEnvs, schemes)
    return Promise.resolve(config)
  }

  #loadConfigFromEnvs(entries: Entry[], envs: NodeJS.ProcessEnv) {
    const filteredEntries = !this.#opts.loadSecrets
      ? entries.filter(e => !isSecret(e.value) || !e.value.secret)
      : entries

    const config = new Map<string, unknown>()
    const jsonSchemes = new Map<string, JSONSchema>()
    const schemes = new Map<string, Entry>()

    for (const entry of filteredEntries) {
      const envAliases = this.#getEnvAliases(entry)
      const defaultEnvKey = this.#buildEnvKeyFromPath(entry.key)
      const allEnvKeys = [defaultEnvKey, ...envAliases.map(a => a.id)]

      const envKeyAndValue = allEnvKeys.map(k => [k, envs[k]] as const).find(([, v]) => v !== undefined)

      if (envKeyAndValue === undefined) {
        continue
      }

      const [ envKey, envValue ] = envKeyAndValue

      const coercedValue = entry.value.coerce?.(envValue) ?? envValue

      config.set(envKey, coercedValue)
      jsonSchemes.set(envKey, entry.value.schema)
      schemes.set(envKey, entry)
    }
    return [ config, jsonSchemes, schemes ] as const;
  }

  #getEnvAliases(entry: Entry) {
    return entry.value.aliases.filter(a => a.sourceKey === "envs");
  }

  #envsToRecord(envs: Map<string, unknown>, schemes: Map<string, Entry>): Record<string, unknown> {
    let record: Record<string, unknown> = {}

    for (const [ key, value ] of schemes) {
      setValueAtPath(record, value.key, envs.get(key))
    }

    return record
  }

  getEvaluatorFunction(loaded: Record<string, unknown>, deps: EnvDeps): EvaluatorFunction {
    const { envs = process.env } = deps
    return {
      name: "envs",
      params: [
        {
          name: "key",
          type: "string",
          required: true
        }
      ],
      fn: args => {
        const key = args.key

        if (typeof key !== "string") {
          throw new Error(`Env indirections must have a "key" argument that is a string, but received ${typeof key} instead.`)
        }

        return this.loadByKey(key, envs)
      }
    }
  }

  loadByKey(envKey: string, envs: NodeJS.ProcessEnv): string | undefined {
    return envs[envKey]
  }

  #buildEnvKeyFromPath(path: string[]): string {
    return [this.#opts.prefix, path.join("_").toUpperCase()].join("")
  }
}

export function envSource(opts: EnvSourceOpts = {}): Source<"envs", EnvDeps> {
  const {prefix = "", loadSecrets = false} = opts

  return new EnvSource({prefix, loadSecrets})
}

export function envAlias(id: string): Alias {
  return {
    id,
    sourceKey: "envs"
  }
}

function isSecret(schema: BaseSchema<unknown>): boolean {
  return schema.secret
}