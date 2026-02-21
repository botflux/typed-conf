import { describe, expect, it } from "vitest";
import { assignOriginToAllProperties, getOrigin } from "./origin.js";

describe("assignOriginToAllProperties", () => {
	it("should assign origin to all properties of a flat object", () => {
		// Given
		const obj = { port: 3000 };

		// When
		assignOriginToAllProperties(obj, "default");

		// Then
		expect(getOrigin(obj)).toEqual({ port: "default" });
	});

	it("should assign origin to nested object properties at the nested level", () => {
		// Given
		const obj = { server: { port: 3000 } };

		// When
		assignOriginToAllProperties(obj, "default");

		// Then
		expect(getOrigin(obj)).toBeUndefined();
		expect(getOrigin(obj.server)).toEqual({ port: "default" });
	});

	it("should handle mixed nesting with origins at each level", () => {
		// Given
		const obj = { a: 1, b: { c: 2 } };

		// When
		assignOriginToAllProperties(obj, "default");

		// Then
		expect(getOrigin(obj)).toEqual({ a: "default" });
		expect(getOrigin(obj.b)).toEqual({ c: "default" });
	});

	it("should handle empty object without error", () => {
		// Given
		const obj = {};

		// When
		assignOriginToAllProperties(obj, "default");

		// Then
		expect(getOrigin(obj)).toBeUndefined();
	});

	it("should skip undefined values", () => {
		// Given
		const obj: Record<string, unknown> = { a: undefined, b: 1 };

		// When
		assignOriginToAllProperties(obj, "default");

		// Then
		expect(getOrigin(obj)).toEqual({ b: "default" });
	});

	it("should treat arrays as leaf values", () => {
		// Given
		const obj = { items: [1, 2, 3] };

		// When
		assignOriginToAllProperties(obj, "default");

		// Then
		expect(getOrigin(obj)).toEqual({ items: "default" });
	});

	it("should handle null as a leaf value", () => {
		// Given
		const obj = { value: null };

		// When
		assignOriginToAllProperties(obj, "default");

		// Then
		expect(getOrigin(obj)).toEqual({ value: "default" });
	});

	it("should handle deeply nested objects", () => {
		// Given
		const obj = { a: { b: { c: { d: 1 } } } };

		// When
		assignOriginToAllProperties(obj, "default");

		// Then
		expect(getOrigin(obj)).toBeUndefined();
		expect(getOrigin(obj.a)).toBeUndefined();
		expect(getOrigin(obj.a.b)).toBeUndefined();
		expect(getOrigin(obj.a.b.c)).toEqual({ d: "default" });
	});
});
