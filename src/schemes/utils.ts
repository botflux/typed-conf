import type { AnySourceType, Source } from "../sources/interfaces.js";
import type { BaseSchema, Branch } from "./base.js";

export function isBranch(
	schema: BaseSchema<unknown, Source<AnySourceType>>,
): schema is BaseSchema<unknown, Source<AnySourceType>> & {
	structure: Branch;
} {
	return schema.structure.kind === "branch";
}
