export type InjectOpts = {
  envs?: NodeJS.ProcessEnv
}

export type Params = {
  key: string
}

export type EnvSourceOpts<Name extends string> = {
  prefix?: string
  name?: Name
}