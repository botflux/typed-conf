import { Number as TypeboxNumber, type TNumberOptions } from "typebox";
import type { Alias, AnySourceType, Source } from "../sources/interfaces.js";
import type { BaseSchema } from "./base.js";

export type NumberSchema<Sources extends Source<AnySourceType>> = BaseSchema<
	number,
	Sources
>;

export type NumberOpts<A extends Alias<AnySourceType>> = {
	aliases?: A[];
	default?: number;
	minimum?: number;
	maximum?: number;
	exclusiveMinimum?: number;
	exclusiveMaximum?: number;
};

function normalizeOpts<A extends Alias<AnySourceType>>(
	aliasesOrOpts?: A[] | NumberOpts<A>,
): NumberOpts<A> {
	if (aliasesOrOpts === undefined) {
		return {};
	}
	if (Array.isArray(aliasesOrOpts)) {
		return { aliases: aliasesOrOpts };
	}
	return aliasesOrOpts;
}

function buildTypeboxOptions(
	opts: NumberOpts<Alias<AnySourceType>>,
): TNumberOptions {
	const typeboxOpts: TNumberOptions = {};

	typeboxOpts.default = opts.default;

	if (opts.minimum !== undefined) {
		typeboxOpts.minimum = opts.minimum;
	}
	if (opts.maximum !== undefined) {
		typeboxOpts.maximum = opts.maximum;
	}
	if (opts.exclusiveMinimum !== undefined) {
		typeboxOpts.exclusiveMinimum = opts.exclusiveMinimum;
	}
	if (opts.exclusiveMaximum !== undefined) {
		typeboxOpts.exclusiveMaximum = opts.exclusiveMaximum;
	}

	return typeboxOpts;
}

export function number<A extends Alias<AnySourceType>>(
	aliasesOrOpts?: A[] | NumberOpts<A>,
): NumberSchema<A["source"]> {
	const opts = normalizeOpts(aliasesOrOpts);
	const aliases = opts.aliases ?? [];

	return {
		type: 0,
		schema: TypeboxNumber(buildTypeboxOptions(opts)),
		structure: { kind: "leaf", aliases },
		sources: aliases.map((alias) => alias.source),
	};
}
