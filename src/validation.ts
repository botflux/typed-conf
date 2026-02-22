import type { TSchema } from "typebox";
import Value, { ParseError } from "typebox/value";
import { inlineCatchSync } from "./inline-catch.js";
import { getOrigin, type Origin } from "./sources/origin.js";
import type { TLocalizedValidationError } from "typebox/error";

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
 * Validate a value against a schema, mapping errors to use origin metadata.
 */
export function validate<T>(
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
