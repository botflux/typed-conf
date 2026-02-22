import { describe, expect, it } from "vitest";
import { string } from "./string.js";
import { Value } from "typebox/value";
import { Object as TypeboxObject } from "typebox";
import { validate } from "../validation.js";
import { appendOrigin } from "../sources/origin.js";

describe("string", () => {
	describe("minLength", () => {
		it("should be able to throw given the string is too short", () => {
			// Given
			const schema = TypeboxObject({ host: string({ minLength: 5 }).schema });
			const value = { host: "abc" };
			appendOrigin(value, "host", "env:HOST");

			// When
			const act = () => validate(schema, value);

			// Then
			expect(act).toThrow(
				new AggregateError([
					new Error("env:HOST must not have fewer than 5 characters"),
				]),
			);
		});
	});

	describe("maxLength", () => {
		it("should be able to throw given the string is too long", () => {
			// Given
			const schema = TypeboxObject({ host: string({ maxLength: 5 }).schema });
			const value = { host: "abcdefgh" };
			appendOrigin(value, "host", "env:HOST");

			// When
			const act = () => validate(schema, value);

			// Then
			expect(act).toThrow(
				new AggregateError([
					new Error("env:HOST must not have more than 5 characters"),
				]),
			);
		});
	});

	describe("default value", () => {
		it("should have no default value by default", () => {
			// Given
			const schema = string();

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
			const schema = string({ default: "localhost" });

			// When
			const result = Value.Default(
				TypeboxObject({
					value: schema.schema,
				}),
				{},
			);

			// Then
			expect(result).toEqual({ value: "localhost" });
		});
	});
});
