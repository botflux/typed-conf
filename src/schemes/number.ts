import type { Alias, AnySourceType, Source } from "../sources/interfaces.js";
import type { BaseSchema } from "./base.js";
import { Number as TypeboxNumber } from "typebox";

export type NumberSchema<Sources extends Source<AnySourceType>> = BaseSchema<
	number,
	Sources
>;

export function number<A extends Alias<AnySourceType>>(
	aliases: A[] = [],
): NumberSchema<A["source"]> {
	return {
		type: 0,
		schema: TypeboxNumber(),
		structure: { kind: "leaf", aliases },
		sources: aliases.map((alias) => alias.source),
	};
}
