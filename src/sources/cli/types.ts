import type { SourceType } from "../interfaces.js";

export type LongAndShortFlag = {
	long: string;
	short?: string;
};

/**
 * Either the long flag `my-port`, or the long and short
 * flag, `{ long: 'my-port', short: 'p' }`
 */
export type AliasOpts = string | LongAndShortFlag;

/**
 * Cli source has no options to pass at load time.
 */
export type LoadFromSchemaOpts = undefined;

/**
 * Argv is the only dependency to inject during testing.
 */
export type Argv = string[];

export type CliSourceType<Name extends string> = SourceType<
	Name,
	AliasOpts,
	LoadFromSchemaOpts,
	Argv
>;
