import { describe, expect, it } from "vitest";
import { number } from "./number.js";
import Value from "typebox/value";
import { Object as TypeboxObject } from "typebox";

describe("number", () => {
	describe("default value", () => {
		it("should have no default value by default", () => {
			// Given
			const schema = number();

			// When
			const result = Value.Default(
				TypeboxObject({
					value: schema.schema,
				}),
				{},
			);

			// Then
			expect(result).toEqual({ value: undefined });
		});

		it("should be able to configure a default value", () => {
			// Given
			const schema = number({ default: 100 });

			// When
			const result = Value.Default(
				TypeboxObject({
					value: schema.schema,
				}),
				{},
			);

			// Then
			expect(result).toEqual({ value: 100 });
		});
	});
});
