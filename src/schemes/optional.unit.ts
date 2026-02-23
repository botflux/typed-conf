import { describe, expect, it } from "vitest";
import { Object as TypeboxObject } from "typebox";
import { Value } from "typebox/value";
import { optional } from "./optional.js";
import { string } from "./string.js";
import { number } from "./number.js";

describe("optional", () => {
	describe("validation", () => {
		it("should pass validation when value is provided", () => {
			// Given
			const schema = TypeboxObject({ host: optional(string()).schema });
			const value = { host: "localhost" };

			// When
			const result = Value.Parse(schema, value);

			// Then
			expect(result).toEqual({ host: "localhost" });
		});

		it("should pass validation when value is undefined", () => {
			// Given
			const schema = TypeboxObject({ port: optional(number()).schema });
			const value = { port: undefined };

			// When
			const result = Value.Parse(schema, value);

			// Then
			expect(result).toEqual({ port: undefined });
		});

		it("should pass validation when value is missing from object", () => {
			// Given
			const schema = TypeboxObject({ port: optional(number()).schema });
			const value = {};

			// When
			const result = Value.Parse(schema, value);

			// Then
			expect(result).toEqual({});
		});
	});
});
