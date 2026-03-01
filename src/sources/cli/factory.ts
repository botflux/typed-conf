import { kebabCase } from "../../naming/kebab-case.js";
import { CliSource } from "./source.js";

export type ImplicitModeOpts = {
	type: "implicit";
	namingConvention?: (key: string) => string;
};

export type CliSourceFactoryOpts<Name extends string> = {
	/**
	 * @default 'explicit'
	 */
	mode?: "implicit" | "explicit" | ImplicitModeOpts;

	/**
	 * @default 'cli'
	 */
	name?: Name;
};

export type NormalizedCliSourceOpts<Name extends string> = {
	name: Name;
	mode: "explicit" | Required<ImplicitModeOpts>;
};

export function cliSource<Name extends string = "cli">(
	nameOrOpts?: Name | CliSourceFactoryOpts<Name>,
): CliSource<Name> {
	const userOpts =
		typeof nameOrOpts === "string" ? { name: nameOrOpts } : (nameOrOpts ?? {});

	const name = (userOpts.name ?? "cli") as Name;
	const mode =
		userOpts.mode === "implicit"
			? ({
					type: "implicit" as const,
					namingConvention: kebabCase,
				} as Required<ImplicitModeOpts>)
			: typeof userOpts.mode === "object" && userOpts.mode.type === "implicit"
				? { namingConvention: kebabCase, ...userOpts.mode }
				: "explicit";

	return new CliSource({ name, mode });
}
