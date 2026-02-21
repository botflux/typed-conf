import type { TSchema } from "typebox";
import Value, { ParseError } from "typebox/value";
import { inlineCatchSync } from "./inline-catch.js";
import type { BaseSchema } from "./schemes/base.js";
import type { AnySourceType, Source } from "./sources/interfaces.js";
import { getOrigin, type Origin } from "./sources/origin.js";
import type { LoadOpts } from "./types.js";
import type { TLocalizedValidationError } from "typebox/error";

type UnwrapArray<T extends unknown[]> = T extends (infer U)[] ? U : never;
type UnwrapSourceType<T> = T extends Source<infer U> ? U : never;

function mapTypeboxValidationError(
	error: TLocalizedValidationError,
	origins?: Origin,
) {
	const propertyKey = error.instancePath.slice(1);
	if (propertyKey === "") {
		return new Error(error.message);
	}
	const origin = origins?.[propertyKey] ?? propertyKey;
	return new Error(`${origin} ${error.message}`);
}

/**
 * Parse and validate a value against a schema, mapping errors to use origin metadata.
 */
function parseWithOrigin<T>(
	schema: TSchema,
	value: Record<string, unknown>,
): T {
	const [parsed, caught] = inlineCatchSync(() => Value.Parse(schema, value));

	if (caught) {
		if (!(caught.error instanceof ParseError)) {
			throw caught.error;
		}

		const errors = caught.error.cause.errors;
		const origins = getOrigin(value);

		const mappedErrors = errors.map((error) =>
			mapTypeboxValidationError(error, origins),
		);

		throw new AggregateError(mappedErrors);
	}

	return parsed as T;
}

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
	const { inject } = opts;

	const source = schema.sources[0];

	if (source === undefined) {
		return {} as Schema["type"];
	}

	const sourceInject = inject?.[source.name as keyof typeof inject] as unknown;
	const result = await source.loadFromSchema(schema, undefined, sourceInject);

	const withDefaults = Value.Default(schema.schema, result) as Record<
		string,
		unknown
	>;

	return parseWithOrigin<Schema["type"]>(schema.schema, withDefaults);
}
