import { describe, expect, it } from "vitest";
import { number } from "./number.js";
import Value from "typebox/value";
import { Object as TypeboxObject } from "typebox";
import { validate } from "../validation.js";
import { appendOrigin } from "../sources/origin.js";

describe("number", () => {
	describe("type validation", () => {
		it("should throw given a non-number value", () => {
			// Given
			const schema = TypeboxObject({ port: number().schema });
			const value = { port: "not-a-number" };
			appendOrigin(value, "port", "env:PORT");

			// When
			const act = () => validate(schema, value);

			// Then
			expect(act).toThrow(
				new AggregateError([new Error("env:PORT must be number")]),
			);
		});
	});

	describe("minimum", () => {
		it("should be able to throw given the number is below minimum", () => {
			// Given
			const schema = TypeboxObject({ port: number({ minimum: 5 }).schema });
			const value = { port: 3 };
			appendOrigin(value, "port", "env:PORT");

			// When
			const act = () => validate(schema, value);

			// Then
			expect(act).toThrow(
				new AggregateError([new Error("env:PORT must be >= 5")]),
			);
		});
	});

	describe("maximum", () => {
		it("should be able to throw given the number is above maximum", () => {
			// Given
			const schema = TypeboxObject({ port: number({ maximum: 100 }).schema });
			const value = { port: 150 };
			appendOrigin(value, "port", "env:PORT");

			// When
			const act = () => validate(schema, value);

			// Then
			expect(act).toThrow(
				new AggregateError([new Error("env:PORT must be <= 100")]),
			);
		});
	});

	describe("exclusiveMinimum", () => {
		it("should be able to throw given the number is equal to exclusiveMinimum", () => {
			// Given
			const schema = TypeboxObject({
				port: number({ exclusiveMinimum: 5 }).schema,
			});
			const value = { port: 5 };
			appendOrigin(value, "port", "env:PORT");

			// When
			const act = () => validate(schema, value);

			// Then
			expect(act).toThrow(
				new AggregateError([new Error("env:PORT must be > 5")]),
			);
		});
	});

	describe("exclusiveMaximum", () => {
		it("should be able to throw given the number is equal to exclusiveMaximum", () => {
			// Given
			const schema = TypeboxObject({
				port: number({ exclusiveMaximum: 100 }).schema,
			});
			const value = { port: 100 };
			appendOrigin(value, "port", "env:PORT");

			// When
			const act = () => validate(schema, value);

			// Then
			expect(act).toThrow(
				new AggregateError([new Error("env:PORT must be < 100")]),
			);
		});
	});

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
