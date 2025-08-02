import type {Source} from "./source.js";

export type EnvSourceOpts = {
  prefix?: string
}

export function envSource (opts: EnvSourceOpts = {}): Source<"envs", NodeJS.ProcessEnv> {
  const { prefix = "" } = opts

  return {
    key: "envs",
    load(envs?: NodeJS.ProcessEnv) : Promise<unknown> {
      const e = envs ?? process.env

      return Promise.resolve(
        Object.fromEntries(Object.entries(e).map(([k, v]) => ([k.replace(prefix, "").toLowerCase(), v] as const)))
      )
    }
  }
}