import type { BaseSchema } from "./schemes/base.js";
import type { AnySourceType, Source } from "./sources/interfaces.js";
import type { LoadOpts } from "./types.js";

type UnwrapArray<T extends unknown[]> = T extends (infer U)[] ? U : never;
type UnwrapSourceType<T> = T extends Source<infer U> ? U : never;

/**
 * Load configuration from sources based on a schema.
 *
 * @param schema - The configuration schema
 * @param opts - Load options including inject for testing
 * @returns The loaded configuration object
 */
export async function load<
	Schema extends BaseSchema<unknown, Source<AnySourceType>>,
>(
	schema: Schema,
	opts: LoadOpts<UnwrapSourceType<UnwrapArray<Schema["sources"]>>>,
): Promise<Schema["type"]> {
	const {
		inject
	} = opts

	const source = schema.sources[0];

	if (source === undefined) {
		return {} as Schema["type"];
	}

	const sourceInject = inject?.[source.name as keyof typeof inject] as unknown;
	const result = await source.loadFromSchema(schema, undefined, sourceInject);

	return result as Schema["type"];
}
