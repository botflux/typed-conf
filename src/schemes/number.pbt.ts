import { describe, it, expect } from "vitest";
import { number } from "./number.js";
import { Value } from "typebox/value";
import { fc, test } from "@fast-check/vitest";

describe("number", () => {
	describe("coercion", () => {
		test.prop({
			input: fc
				.float({ noDefaultInfinity: true })
				/**
				 * -0 is parsed to 0, and thus the property `coerce(n.toString()) === n` does not hold in this case.
				 */
				.filter((n) => !Object.is(n, -0) && !Number.isNaN(n)),
		})("should be able to coerce any float to a number", ({ input }) => {
			// Given
			const schema = number();

			// When
			const result = Value.Parse(schema.schema, input.toString());

			// Then
			expect(result).toEqual(input);
		});
	});
});
