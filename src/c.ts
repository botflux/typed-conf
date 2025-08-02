import type {Source, SourcesToRecord} from "./sources/source.js";
import {type BaseSchema, kType, object, type ObjectSchema, string} from "./schemes.js";

export const c = {
  config,
  string,
  object,
}

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Static<
  T extends ConfigSpec<
    ObjectSchema<Record<string, BaseSchema<unknown>>>,
    Source<string, never>[]
  >
> = Prettify<T["configSchema"][typeof kType]>

export type LoadOpts<Sources extends Source<string, never>[]> = {
  sources: SourcesToRecord<Sources>
}

export type ConfigSpec<ConfigSchema extends ObjectSchema<Record<string, BaseSchema<any>>>, Sources extends Source<string, never>[]> = {
  configSchema: ConfigSchema
  sources: Sources
  load: (opts: LoadOpts<Sources>) => Promise<Prettify<ConfigSchema[typeof kType]>>
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

