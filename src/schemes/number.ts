import { Number as TypeboxNumber } from "typebox";
import type { Alias, AnySourceType, Source } from "../sources/interfaces.js";
import type { BaseSchema } from "./base.js";

export type NumberSchema<Sources extends Source<AnySourceType>> = BaseSchema<
	number,
	Sources
>;

export type NumberOpts<A extends Alias<AnySourceType>> = {
	aliases?: A[];
	default?: number;
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

export function number<A extends Alias<AnySourceType>>(
	aliasesOrOpts?: A[] | NumberOpts<A>,
): NumberSchema<A["source"]> {
	const opts = normalizeOpts(aliasesOrOpts);
	const aliases = opts.aliases ?? [];

	return {
		type: 0,
		schema:
			opts.default !== undefined
				? TypeboxNumber({ default: opts.default })
				: TypeboxNumber(),
		structure: { kind: "leaf", aliases },
		sources: aliases.map((alias) => alias.source),
	};
}
