import type {Source, SourcesToRecord} from "./sources/source.js";
import {type BaseSchema, boolean, float, integer, kType, object, type ObjectSchema, secret, string} from "./schemes.js";
import {merge} from "merge-anything";

export const c = {
  config,
  string,
  object,
  boolean,
  integer,
  float,
  secret
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

export type Static2<T extends BaseSchema<unknown>> = T[typeof kType]

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

      let previouslyLoaded = {}

      for (const source of configOpts.sources) {
        // @ts-expect-error
        const o = sources[source.key] as any
        const loaded = await source.load(configOpts.schema, previouslyLoaded, o) as any

        previouslyLoaded = merge(previouslyLoaded, loaded)
      }

      return previouslyLoaded as Prettify<Schema[typeof kType]>
    },
  }
}

