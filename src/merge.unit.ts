import { describe, expect, it } from "vitest";
import { mergeConfigs } from "./merge.js";
import { appendOrigin, getOrigin } from "./sources/origin.js";

describe("mergeConfigs", () => {
	it("should pass through a single config unchanged", () => {
		// Given
		const config = { a: 1 };
		appendOrigin(config, "a", "source:A");

		// When
		const result = mergeConfigs([config]);

		// Then
		expect(result).toEqual({ a: 1 });
		expect(getOrigin(result)).toEqual({ a: "source:A" });
	});

	it("should use higher precedence value when both configs have same key", () => {
		// Given
		const high = { a: 1 };
		appendOrigin(high, "a", "envs:A");

		const low = { a: 2 };
		appendOrigin(low, "a", "default");

		// When
		const result = mergeConfigs([high, low]);

		// Then
		expect(result).toEqual({ a: 1 });
		expect(getOrigin(result)).toEqual({ a: "envs:A" });
	});

	it("should fill gaps from lower precedence configs", () => {
		// Given
		const high = { a: 1 };
		appendOrigin(high, "a", "envs:A");

		const low = { b: 2 };
		appendOrigin(low, "b", "default");

		// When
		const result = mergeConfigs([high, low]);

		// Then
		expect(result).toEqual({ a: 1, b: 2 });
		expect(getOrigin(result)).toEqual({ a: "envs:A", b: "default" });
	});

	it("should deep merge nested objects", () => {
		// Given
		const high = { server: { host: "localhost" } };
		appendOrigin(high.server, "host", "envs:HOST");

		const low = { server: { port: 3000 } };
		appendOrigin(low.server, "port", "default");

		// When
		const result = mergeConfigs([high, low]);

		// Then
		expect(result).toEqual({ server: { host: "localhost", port: 3000 } });
		const serverOrigin = getOrigin(
			result.server as Record<string | symbol, unknown>,
		);
		expect(serverOrigin).toEqual({ host: "envs:HOST", port: "default" });
	});

	it("should preserve origin from winning value in nested objects", () => {
		// Given
		const high = { server: { port: 8080 } };
		appendOrigin(high.server, "port", "envs:PORT");

		const low = { server: { port: 3000 } };
		appendOrigin(low.server, "port", "default");

		// When
		const result = mergeConfigs([high, low]);

		// Then
		expect(result).toEqual({ server: { port: 8080 } });
		const serverOrigin = getOrigin(
			result.server as Record<string | symbol, unknown>,
		);
		expect(serverOrigin).toEqual({ port: "envs:PORT" });
	});

	it("should handle empty configs by falling back to lower precedence", () => {
		// Given
		const high = {};
		const low = { a: 1 };
		appendOrigin(low, "a", "default");

		// When
		const result = mergeConfigs([high, low]);

		// Then
		expect(result).toEqual({ a: 1 });
		expect(getOrigin(result)).toEqual({ a: "default" });
	});

	it("should not merge arrays - first defined array wins", () => {
		// Given
		const high = { items: [1] };
		appendOrigin(high, "items", "envs:ITEMS");

		const low = { items: [2, 3] };
		appendOrigin(low, "items", "default");

		// When
		const result = mergeConfigs([high, low]);

		// Then
		expect(result).toEqual({ items: [1] });
		expect(getOrigin(result)).toEqual({ items: "envs:ITEMS" });
	});

	it("should handle empty config list", () => {
		// Given
		const configs: Record<string, unknown>[] = [];

		// When
		const result = mergeConfigs(configs);

		// Then
		expect(result).toEqual({});
	});

	it("should handle configs without origin metadata", () => {
		// Given
		const high = { a: 1 };
		const low = { b: 2 };

		// When
		const result = mergeConfigs([high, low]);

		// Then
		expect(result).toEqual({ a: 1, b: 2 });
		expect(getOrigin(result)).toBeUndefined();
	});

	it("should handle mixed configs with and without origin metadata", () => {
		// Given
		const high = { a: 1 };
		appendOrigin(high, "a", "envs:A");

		const low = { b: 2 }; // No origin

		// When
		const result = mergeConfigs([high, low]);

		// Then
		expect(result).toEqual({ a: 1, b: 2 });
		expect(getOrigin(result)).toEqual({ a: "envs:A" });
	});
});
