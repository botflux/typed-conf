import {EnvSource} from "./source.js";
import type {SomeRequired} from "../../types.js";

export type EnvSourceOpts<Name extends string> = {
  /**
   * The name of the env source.
   */
  name?: Name

  /**
   * When set to 'implicit', the source will compute an env name based on the name of the config entry.
   *
   * For example, the following schema:
   * ```typescript
   * const schema = object({ host: string() })
   * ```
   * will automatically look for an env named `HOST`.
   * The same logic applies to nested objects.
   * The following schema:
   * ```typescript
   * const schema = object({ db: object({ host: string() }) })
   * ```
   * will automatically look for an env named `DB_HOST`.
   *
   * On the other hand, when set to 'explicit', the source will load envs based on the explicit aliases.
   *
   * For example, the following schema:
   * ```typescript
   * const schema = object({ host: string([envs.alias('HOST')]) })
   * ```
   * will load the env named `HOST`.
   *
   * Note that aliases still work in implicit mode.
   */
  mode?: 'explicit' | 'implicit'
}

export type EnvSourceRequiredFields = keyof Pick<EnvSourceOpts<string>, 'name' | 'mode'>
export type RequiredEnvSourceOpts<Name extends string> = SomeRequired<EnvSourceOpts<Name>, EnvSourceRequiredFields>


/**
 * Create an env source.
 *
 * @param opts
 */
export function envSource<Name extends string = 'envs'>(opts?: EnvSourceOpts<Name>): EnvSource<Name>

/**
 * Create an env source.
 *
 * @param name You can give a name to the source.
 *             It'll modify the key used to pass options in the load function calls.
 */
export function envSource<Name extends string = 'envs'>(name?: Name): EnvSource<Name>

/**
 * Create an env source.
 *
 * @param nameOrOpts
 */
export function envSource<Name extends string = 'envs'>(nameOrOpts?: Name | EnvSourceOpts<Name>): EnvSource<Name> {
  const defaults = {
    mode: 'explicit' as const,
    name: 'envs' as Name
  } satisfies RequiredEnvSourceOpts<Name>

  const opts = typeof nameOrOpts === 'string' ? {
    ...defaults,
    name: nameOrOpts
  } satisfies RequiredEnvSourceOpts<Name> : {
    ...defaults,
    ...nameOrOpts,
  } satisfies RequiredEnvSourceOpts<Name>

  return new EnvSource(opts)
}