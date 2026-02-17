import { EnvSource } from "./source.js";
import type { SomeRequired } from "../../types.js";

export type ImplicitModeOpts = {
	type: 'implicit'

	/**
	 * A function that transforms a camel case path chunk into the naming convention you want.
	 *
	 * The function will be called with each path chunk so if you have the following schema:
	 *
	 * ```typescript
	 * const schema = object({
	 *  db: object({
	 *    url: string()
	 *  })
	 * })
	 * ```
	 *
	 * Then, it'll be called twice, one time with `db`, and one time `url`.
	 *
	 * By default, the naming convention is SCREAMING_SNAKE_CASE.
	 *
	 * @param key
	 * @default screamingSnakeCase
	 */
	namingConvention?: (key: string) => string

	/**
	 * The character that is used to separate chunks of an entry path.
	 *
	 * If you have the following schema:
	 *
	 * ```typescript
	 * const schema = object({
	 * 	db: object({
	 * 		url: string()
	 * 	})
	 * })
	 * ```
	 *
	 * Then, by default, the envs will be named `DB_URL`.
	 * By changing the separator to `.`, the envs will be named `DB.URL`.
	 *
	 * Take a look at the `namingConvention` option to change the naming convention applied.
	 *
	 * @default "_"
	 */
	separator?: string
}

export type EnvSourceOpts<Name extends string> = {
	/**
	 * The name of the env source.
	 */
	name?: Name;

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
	mode?: "explicit" | "implicit" | ImplicitModeOpts;
};

export type EnvSourceRequiredFields = keyof Pick<
	EnvSourceOpts<string>,
	"name" | "mode"
>;
export type RequiredEnvSourceOpts<Name extends string> = SomeRequired<
	EnvSourceOpts<Name>,
	EnvSourceRequiredFields
>;

/**
 * Create an env source.
 *
 * @param opts
 */
export function envSource<Name extends string = "envs">(
	opts?: EnvSourceOpts<Name>,
): EnvSource<Name>;

/**
 * Create an env source.
 *
 * @param name You can give a name to the source.
 *             It'll modify the key used to pass options in the load function calls.
 */
export function envSource<Name extends string = "envs">(
	name?: Name,
): EnvSource<Name>;

/**
 * Create an env source.
 *
 * @param nameOrOpts
 */
export function envSource<Name extends string = "envs">(
	nameOrOpts?: Name | EnvSourceOpts<Name>,
): EnvSource<Name> {
	const defaults = {
		mode: "explicit" as const,
		name: "envs" as Name,
	} satisfies RequiredEnvSourceOpts<Name>;

	const opts =
		typeof nameOrOpts === "string"
			? ({
					...defaults,
					name: nameOrOpts,
				} satisfies RequiredEnvSourceOpts<Name>)
			: ({
					...defaults,
					...nameOrOpts,
				} satisfies RequiredEnvSourceOpts<Name>);

	return new EnvSource(opts);
}
