import { kebabCase } from "../../naming/kebab-case.js";
import { CliSource } from "./source.js";

export type CliSourceFactoryOpts<Name extends string> = {
	/**
	 * @default 'explicit'
	 */
	mode?: "implicit" | "explicit";

	/**
	 * @default 'cli'
	 */
	name?: Name;
};

export type NormalizedCliSourceOpts<Name extends string> = {
	name: Name;
	mode:
		| "explicit"
		| { type: "implicit"; namingConvention: (key: string) => string };
};

export function cliSource<Name extends string = "cli">(
	nameOrOpts?: Name | CliSourceFactoryOpts<Name>,
): CliSource<Name> {
	const userOpts =
		typeof nameOrOpts === "string" ? { name: nameOrOpts } : (nameOrOpts ?? {});

	const name = (userOpts.name ?? "cli") as Name;
	const mode =
		userOpts.mode === "implicit"
			? { type: "implicit" as const, namingConvention: kebabCase }
			: "explicit";

	return new CliSource({ name, mode });
}
