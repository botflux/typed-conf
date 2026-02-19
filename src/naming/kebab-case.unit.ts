import { describe, it, expect } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { kebabCase } from "./kebab-case.js";

describe("kebabCase", () => {
	it("should be able to transform a simple name", () => {
		// Given
		const name = "serverHost";

		// When
		const result = kebabCase(name);

		// Then
		expect(result).toEqual("server-host");
	});

	it("should be able to transform a name made of multiple case change", () => {
		// Given
		const name = "myServerHost";

		// When
		const result = kebabCase(name);

		// Then
		expect(result).toEqual("my-server-host");
	});

	it("should be able to lowercase acronyms", () => {
		// Given
		const name = "myURL";

		// When
		const result = kebabCase(name);

		// Then
		expect(result).toEqual("my-url");
	});

	test.prop({
		name: fc.string().filter((s) => s.toLowerCase() === s),
	})(
		"should be able to not change string without uppercase character",
		({ name }) => {
			// Given
			// When
			const result = kebabCase(name);

			// Then
			expect(result).toEqual(name);
		},
	);

	test.prop({
		name: fc.string().filter((s) => s.toUpperCase() === s),
	})(
		"should be able to lowercase names that only contain uppercase characters",
		({ name }) => {
			// Given
			// When
			const result = kebabCase(name);

			// Then
			expect(result).toEqual(name.toLowerCase());
		},
	);
});
