import { String as TypeboxString, type TStringOptions } from "typebox";
import type { Alias, AnySourceType, Source } from "../sources/interfaces.js";
import type { BaseSchema } from "./base.js";

export type StringSchema<Sources extends Source<AnySourceType>> = BaseSchema<
	string,
	Sources
>;

export type StringOpts<A extends Alias<AnySourceType>> = {
	aliases?: A[];
	minLength?: number;
	maxLength?: number;
	default?: string;
};

function normalizeOpts<A extends Alias<AnySourceType>>(
	aliasesOrOpts?: A[] | StringOpts<A>,
): StringOpts<A> {
	if (aliasesOrOpts === undefined) {
		return {};
	}
	if (Array.isArray(aliasesOrOpts)) {
		return { aliases: aliasesOrOpts };
	}
	return aliasesOrOpts;
}

function buildTypeboxOptions(
	opts: StringOpts<Alias<AnySourceType>>,
): TStringOptions {
	const typeboxOpts: TStringOptions = {};

	if (opts.minLength !== undefined) {
		typeboxOpts.minLength = opts.minLength;
	}
	if (opts.maxLength !== undefined) {
		typeboxOpts.maxLength = opts.maxLength;
	}
	if (opts.default !== undefined) {
		typeboxOpts.default = opts.default;
	}

	return typeboxOpts;
}

export function string<A extends Alias<AnySourceType>>(
	aliasesOrOpts?: A[] | StringOpts<A>,
): StringSchema<A["source"]> {
	const opts = normalizeOpts(aliasesOrOpts);
	const aliases = opts.aliases ?? [];

	return {
		// This mutant can be ignored because the value should never by used, only the type.
		// Stryker disable next-line all
		type: "",
		schema: TypeboxString(buildTypeboxOptions(opts)),
		structure: { kind: "leaf", aliases },
		sources: aliases.map((alias) => alias.source),
	};
}
