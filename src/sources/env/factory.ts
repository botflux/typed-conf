import { screamingSnakeCase } from "../../naming/screaming-snake-case.js";
import { EnvSource } from "./source.js";

export type ImplicitModeOpts = {
	type: "implicit";

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
	namingConvention?: (key: string) => string;

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
	separator?: string;

	/**
	 * A string prepended to all implicit env names.
	 *
	 * If you have the following schema:
	 *
	 * ```typescript
	 * const schema = object({
	 *   host: string(),
	 *   db: object({
	 *     url: string()
	 *   })
	 * })
	 * ```
	 *
	 * With `prefix: 'MYAPP'`, the source will look for `MYAPP_HOST` and `MYAPP_DB_URL`.
	 *
	 * The prefix is joined using the configured `separator` (underscore by default).
	 * So with `prefix: 'my-app'` and `separator: '.'`, you'd get `my-app.host` and `my-app.db.url`.
	 *
	 * This is handy when your app's envs share a namespace with other tools or services.
	 */
	prefix?: string;
};

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

export type NormalizedImplicitModeOpts = {
	type: "implicit";
	namingConvention: (key: string) => string;
	separator: string;
	prefix?: string;
};

export type NormalizedEnvSourceOpts<Name extends string> = {
	name: Name;
	mode: "explicit" | NormalizedImplicitModeOpts;
};

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
	const userOpts =
		typeof nameOrOpts === "string" ? { name: nameOrOpts } : (nameOrOpts ?? {});

	const name = (userOpts.name ?? "envs") as Name;
	const mode = normalizeMode(userOpts.mode);

	return new EnvSource({ name, mode });
}

function normalizeMode(
	mode: EnvSourceOpts<string>["mode"],
): NormalizedEnvSourceOpts<string>["mode"] {
	if (mode === undefined || mode === "explicit") {
		return "explicit";
	}

	if (mode === "implicit") {
		return {
			type: "implicit",
			namingConvention: screamingSnakeCase,
			separator: "_",
		};
	}

	return {
		type: "implicit",
		namingConvention: mode.namingConvention ?? screamingSnakeCase,
		separator: mode.separator ?? "_",
		...(mode.prefix !== undefined && { prefix: mode.prefix }),
	};
}
