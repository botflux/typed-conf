import { String as TypeboxString } from "typebox";
import type { Alias, AnySourceType, Source } from "../sources/interfaces.js";
import type { BaseSchema } from "./base.js";

export type StringSchema<Sources extends Source<AnySourceType>> = BaseSchema<
	string,
	Sources
>;

export function string<A extends Alias<AnySourceType>>(
	aliases: A[] = [],
): StringSchema<A["source"]> {
	return {
		type: "",
		schema: TypeboxString(),
		structure: { kind: "leaf", aliases },
		sources: aliases.map((alias) => alias.source),
	};
}
