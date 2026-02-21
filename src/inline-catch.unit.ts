import { describe, it, expect } from "vitest";
import { inlineCatchSync } from "./inline-catch.js";

describe("inlineCatchSync", () => {
	it("should return value when function succeeds", () => {
		// Given
		const fn = () => 42;

		// When
		const [value, caught] = inlineCatchSync(fn);

		// Then
		expect(value).toBe(42);
		expect(caught).toBeUndefined();
	});

	it("should return error when function throws", () => {
		// Given
		const error = new Error("test error");
		const fn = () => {
			throw error;
		};

		// When
		const [value, caught] = inlineCatchSync(fn);

		// Then
		expect(value).toBeUndefined();
		expect(caught).toEqual({ error });
	});
});
