import type { TSchema } from "typebox";
import type { Alias, AnySourceType } from "../sources/interfaces.js";

export type Leaf = {
	kind: "leaf";
	aliases: Alias<AnySourceType>[];
};

export type Branch = {
	kind: "branch";
	children: Record<string, BaseSchema<unknown>>;
};

export type BaseSchema<T> = {
	type: T;
	schema: TSchema;
	structure: Branch | Leaf;
};
