import type { AnySourceType, Source } from "../sources/interfaces.js";
import type { BaseSchema, Branch } from "./base.js";

export type BranchSchema = BaseSchema<unknown, Source<AnySourceType>> & {
	structure: Branch;
};

export function isBranch(
	schema: BaseSchema<unknown, Source<AnySourceType>>,
): schema is BranchSchema {
	return schema.structure.kind === "branch";
}
