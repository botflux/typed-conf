import type {Source} from "../c.js";

export function envSource (): Source<"envs", NodeJS.ProcessEnv> {
  return {
    key: "envs",
    load(envs?: NodeJS.ProcessEnv) : Promise<unknown> {
      const e = envs ?? process.env

      return Promise.resolve(
        Object.fromEntries(Object.entries(e).map(([k, v]) => ([k.toLowerCase(), v] as const)))
      )
    }
  }
}