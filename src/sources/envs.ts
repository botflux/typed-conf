import type {Source} from "./source.js";
import {type Alias, flatten, type ObjectSchema, type ObjectSpec} from "../schemes.js";

export type EnvSourceOpts = {
  prefix?: string
}

export function envSource (opts: EnvSourceOpts = {}): Source<"envs", NodeJS.ProcessEnv> {
  const { prefix = "" } = opts

  return {
    key: "envs",
    load(schema: ObjectSchema<ObjectSpec>, envs: NodeJS.ProcessEnv = process.env) : Promise<unknown> {
      const entries = flatten(schema)
      const config = {}

      for (const entry of entries) {
        const envAliases = entry.value._aliases.filter(a => a.sourceKey === "envs")
        const defaultEnvKey = [prefix, entry.key.join("_").toUpperCase()].join("")
        const allEnvKeys = [ defaultEnvKey, ...envAliases.map(a => a.id) ]

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
}

export function envAlias (id: string): Alias {
  return {
    id,
    sourceKey: "envs"
  }
}