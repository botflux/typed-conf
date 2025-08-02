import type {Source, SourcesToRecord} from "./sources/source.js";
import {type ConfSchema, object, type ObjectSchema, string} from "./schemes.js";

export const c = {
  config,
  string,
  object,
}

export type Static<T> = T extends ObjectSchema<infer U> ? U : never

export type LoadOpts<Sources extends Source<string, never>[]> = {
  sources: SourcesToRecord<Sources>
}

export type ConfigSpec<ConfigSchema extends ObjectSchema<Record<string, ConfSchema>>, Sources extends Source<string, never>[]> = {
  configSchema: ConfigSchema
  sources: Sources
  load: (opts: LoadOpts<Sources>) => Promise<Static<ConfigSchema>>
}

export type ConfigOpts<Schema extends ObjectSchema<Record<string, any>>, Sources extends Source<string, never>[]> = {
  schema: Schema
  sources: Sources
}

function config<Schema extends ObjectSchema<Record<string, any>>, Sources extends Source<string, never>[]>(configOpts: ConfigOpts<Schema, Sources>): ConfigSpec<Schema, Sources> {
  return {
    configSchema: configOpts.schema,
    sources: configOpts.sources,
    load: async (opts: LoadOpts<Sources>) => {
      const { sources } = opts
      
      for (const source of configOpts.sources) {
        // @ts-expect-error
        const o = sources[source.key] as any
        return await source.load(o) as any
      }
      
      throw new Error("Not implemented at line 67 in c.ts")
    },
  }
}

