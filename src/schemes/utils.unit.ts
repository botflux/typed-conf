import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { isBranch } from "./utils.js";
import { object } from "./object.js";
import { string } from "./string.js";
import { number } from "./number.js";
import { boolean } from "./boolean.js";

describe("isBranch", () => {
	it("should return true for an object schema", () => {
		// Given
		const schema = object({ host: string() });

		// When
		const result = isBranch(schema);

		// Then
		expect(result).toBe(true);
	});

	test.prop({
		leafSchema: fc.constantFrom(string(), number(), boolean()),
	})("should return false for any leaf schema", ({ leafSchema }) => {
		// Given
		// When
		const result = isBranch(leafSchema);

		// Then
		expect(result).toBe(false);
	});
});
