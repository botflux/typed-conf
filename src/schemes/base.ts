import type { TSchema } from "typebox";
import type { Alias, AnySourceType, Source } from "../sources/interfaces.js";

export type Leaf = {
	kind: "leaf";
	aliases: Alias<AnySourceType>[];
};

export type Branch = {
	kind: "branch";
	children: Record<string, BaseSchema<unknown, Source<AnySourceType>>>;
};

export type BaseSchema<T, S extends Source<AnySourceType>> = {
	type: T;
	schema: TSchema;
	structure: Branch | Leaf;
	sources: S[];
};
