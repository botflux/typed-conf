
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
  string
}

export type Static<T> = T extends ObjectSchema<infer U> ? U : never

export type LoadOpts = {
  sources: {
    envs: Record<string, string>
  }
}

export type ConfigSpec<ConfigSchema extends ObjectSchema<Record<string, ConfSchema>>> = {
  configSchema: ConfigSchema
  load: (opts: LoadOpts) => Promise<Static<ConfigSchema>>
}

function config<T extends ObjectSpec>(objSpec: T): ConfigSpec<ObjectSchema<T>> {
  return {
    configSchema: {
      type: "object",
      spec: objSpec
    },
    load: async (opts: LoadOpts) => {
      const { sources: { envs } } = opts
      const entries = Object.entries(envs)

      return Object.fromEntries(entries.map(([key, value ]) => [ key.toLowerCase(), value ])) as any
    }
  }
}

function string(): StringSchema {
  return {
    type: "string"
  }
}