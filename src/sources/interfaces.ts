import type {BaseSchema} from "../schemes/base.js";

/**
 * A generic type that holds all the generic types of a source.
 * I prefer defining such a type instead of having a lot of generics.
 */
export type SourceType<Name extends string, AliasOpts, LoadFromSchemaOpts, InjectOpts> = {
  /**
   * The name of the source.
   * A source can be registered multiple times, and this name makes it easy to discriminate an instance.
   */
  name: Name

  /**
   * The parameter type of the alias method.
   */
  Alias: AliasOpts

  /**
   * The parameter type of the `loadFromSchema` method.
   * For an env source, this would be empty; for a file source, it would be the file path, and encoding.
   */
  LoadFromSchema: LoadFromSchemaOpts

  /**
   * The type that is used to represent the "load time" dependencies of the source.
   *
   * When I say "load time" dependencies, I mean the dependencies that can be provided
   * when calling load.
   *
   * This options object should only be used to inject dependencies for testing purposes.
   *
   * With an env source, you could inject `NodeJS.ProcessEnv` as it is the only dependency
   * of an env source.
   *
   * A file source could accept a `FileSystem` interface with a read file method.
   */
  Inject: InjectOpts
}

/**
 * Just a type util to make type constrains easier.
 */
export type AnySourceType = SourceType<string, any, any, any>

/**
 * An alias is an explicit reference over a piece of configuration.
 * The options an alias takes depend on the source.
 *
 * An env alias could take only a env key, while
 * a file alias could take both a filename and an encoding.
 */
export type Alias<Type extends AnySourceType> = {
  /**
   * The source that was used to create the alias.
   */
  source: Source<Type>

  /**
   * The alias's options.
   */
  aliasOpts: Type["Alias"]
}

export interface Source<Type extends AnySourceType> {
  name: Type["name"]

  /**
   * Create an alias from the source.
   *
   * @param opts
   */
  alias(opts: Type["Alias"]): Alias<Type>

  /**
   * Load a configuration from the source based on its schema.
   *
   * @param schema
   * @param opts
   * @param inject
   */
  loadFromSchema(schema: BaseSchema<unknown>, opts: Type["LoadFromSchema"], inject: Type["Inject"]): Promise<Record<string, unknown>>
}