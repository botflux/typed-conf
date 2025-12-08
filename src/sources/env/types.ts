export type InjectOpts = {
  envs?: NodeJS.ProcessEnv
}

export type LoadSingleParams = {
  key: string
}

export type LoadParams = undefined

export type EnvSourceOpts<Name extends string> = {
  prefix?: string
  name?: Name
}