
export type StringSchema = {
  type: "string"
}

export type ObjectSchema<T extends ObjectSpec> = {
  type: "object"
  spec: T
}

export type ConfSchema = StringSchema

export type ObjectSpec = Record<string, ConfSchema>

export const c = {
  config,
  string,
  object,
}

export type Static<T> = T extends ObjectSchema<infer U> ? U : never

export type LoadOpts<Sources extends Source<string, never>[]> = {
  sources: SourcesToRecord<Sources>
}

export type Source<K extends string, V> = {
  key: K
  load: (opts?: V) => Promise<unknown>
}

type ExtractItemFromArray<T> = T extends Array<infer U> ? U : never

type SourceToRecord<T extends Source<string, never>> = T extends Source<infer K, infer V>
  ? Record<K, V>
  : never

export type MergeUnionTypes<T> = (T extends any ? (x: T) => any : never) extends
  (x: infer R) => any ? R : never;

export type SourcesToRecord<T extends Source<string, never>[]> = Partial<MergeUnionTypes<SourceToRecord<ExtractItemFromArray<T>>>>

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

function object<T extends ObjectSpec>(spec: T): ObjectSchema<T> {
  return {
    type: "object",
    spec
  }
}

function string(): StringSchema {
  return {
    type: "string"
  }
}