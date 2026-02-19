import { fc, test } from "@fast-check/vitest";
import { describe, expect, it } from "vitest";
import { screamingSnakeCase } from "./screaming-snake-case.js";

describe("screamingSnakeCase", () => {
	it("should be able to transform a simple name", () => {
		// Given
		const name = "serverHost";

		// When
		const result = screamingSnakeCase(name);

		// Then
		expect(result).toEqual("SERVER_HOST");
	});

	it("should be able to transform a name made of multiple case change", () => {
		// Given
		const name = "myServerHost";

		// When
		const result = screamingSnakeCase(name);

		// Then
		expect(result).toEqual("MY_SERVER_HOST");
	});

	it("should be able to not transform acronymes", () => {
		// Given
		const name = "myURL";

		// When
		const result = screamingSnakeCase(name);

		// Then
		expect(result).toEqual("MY_URL");
	});

	test.prop({
		name: fc.string().filter((s) => s.toLowerCase() === s),
	})(
		"names containing only lowercase characters should just be uppercased",
		({ name }) => {
			// Given
			// When
			const result = screamingSnakeCase(name);

			// Then
			expect(result).toEqual(name.toUpperCase());
		},
	);

	test.prop({
		name: fc.string().filter((s) => s.toUpperCase() === s),
	})(
		"names containing only uppercase characters should not be changed",
		({ name }) => {
			// Given
			// When
			const result = screamingSnakeCase(name);

			// Then
			expect(result).toEqual(name);
		},
	);
});
