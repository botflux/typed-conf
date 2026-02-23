import { Optional as TypeboxOptional } from "typebox";
import type { AnySourceType, Source } from "../sources/interfaces.js";
import type { BaseSchema } from "./base.js";

export type OptionalSchema<
	Schema extends BaseSchema<unknown, Source<AnySourceType>>,
> = BaseSchema<Schema["type"] | undefined, Schema["sources"][number]>;

export function optional<
	Schema extends BaseSchema<unknown, Source<AnySourceType>>,
>(schema: Schema): OptionalSchema<Schema> {
	return {
		...schema,
		schema: TypeboxOptional(schema.schema),
	} as OptionalSchema<Schema>;
}
