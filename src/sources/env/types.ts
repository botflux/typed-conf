import type {SourceType} from "../interfaces.js";

/**
 * Name: can be changed based on the instance since it is the instance its "identifier".
 * Alias: An env alias is only a string, the env's key.
 * LoadFromSchemaOpts: The env source has no options to pass at load time.
 * InjectOpts: The envs are the only info to inject during testing.
 */
export type EnvSourceType<Name extends string> = SourceType<Name, string, undefined, NodeJS.ProcessEnv>