import type {Source} from "./source.js";
import type {EvaluatorFunction} from "../indirection/default-evaluator.js";
import {setValueAtPath} from "../utils.js";
import {type Alias, type BaseSchema, type Entry, flatten} from "../schemes/base.js";
import type {SecretSchema} from "../schemes/secret.js";
import type {ObjectSchema, ObjectSpec} from "../schemes/object.js";
import {AjvSchemaValidator} from "../validation/ajv.js";
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

class EnvSource implements Source<"envs", NodeJS.ProcessEnv> {
  key: "envs" = "envs" as const

  #opts: Required<EnvSourceOpts>
  #validator = new AjvSchemaValidator()

  constructor(config: Required<EnvSourceOpts>) {
    this.#opts = config
  }

  async load(schema: ObjectSchema<ObjectSpec>, loaded: Record<string, unknown>, envs: NodeJS.ProcessEnv = process.env): Promise<Record<string, unknown>> {
    const entries = flatten(schema)
    const config = this.#loadConfigFromEnvs(entries, envs)

    return Promise.resolve(config)
  }

  #loadConfigFromEnvs(entries: Entry[], envs: NodeJS.ProcessEnv) {
    const filteredEntries = !this.#opts.loadSecrets
      ? entries.filter(e => !isSecret(e.value))
      : entries

    const config = {}

    for (const entry of filteredEntries) {
      const envAliases = entry.value.aliases.filter(a => a.sourceKey === "envs")
      const defaultEnvKey = this.#buildEnvKeyFromPath(entry.key)
      const allEnvKeys = [defaultEnvKey, ...envAliases.map(a => a.id)]

      const envKeyAndValue = allEnvKeys.map(k => [k, envs[k]] as const).find(([, v]) => v !== undefined)

      if (envKeyAndValue === undefined) {
        continue
      }

      const [ envKey, envValue ] = envKeyAndValue

      const coercedValue = entry.value.coerce?.(envValue) ?? envValue

      this.#validator.validate(entry.value.schema, coercedValue, `Env ${envKey}`)

      setValueAtPath(config, entry.key, coercedValue)
    }
    return config;
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

  #buildEnvKeyFromPath(path: string[]): string {
    return [this.#opts.prefix, path.join("_").toUpperCase()].join("")
  }

  #buildValidationSchema(entries: Entry[]) {
    const schema: JSONSchema = {
      type: "object",
      properties: {},
      required: []
    }

    for (const entry of entries) {
      const envKey = this.#buildEnvKeyFromPath(entry.key)

      schema.properties![envKey] = entry.value.schema
    }

    return schema
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