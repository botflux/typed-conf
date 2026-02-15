import { describe, expect, it } from "vitest";
import { hello } from "./index.js";

describe("hello", () => {
	it("should be able to say hello", () => {
		// Given
		// When
		const result = hello("John");

		// Then
		expect(result).toEqual("Hello John!");
	});
});
