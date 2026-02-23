import { describe, expectTypeOf, it } from "vitest";
import type { Source, SourceType } from "../sources/interfaces.js";
import { optional } from "./optional.js";
import { string } from "./string.js";
import { number } from "./number.js";

describe("optional", () => {
	it("should transform string type to string | undefined", () => {
		// Given
		const schema = optional(string());

		// Then
		expectTypeOf(schema.type).toEqualTypeOf<string | undefined>();
	});

	it("should transform number type to number | undefined", () => {
		// Given
		const schema = optional(number());

		// Then
		expectTypeOf(schema.type).toEqualTypeOf<number | undefined>();
	});

	it("should preserve source types from the wrapped schema", () => {
		// Given
		type SourceType1 = SourceType<
			"source1",
			{ s1: string },
			unknown,
			{ inject1: string }
		>;

		const source1 = {
			alias(opts: { s1: string }) {
				return { source: this as Source<SourceType1>, opts };
			},
		} as unknown as Source<SourceType1>;

		// When
		const schema = optional(string([source1.alias({ s1: "" })]));

		// Then
		expectTypeOf(schema.sources).toEqualTypeOf<Array<Source<SourceType1>>>();
	});
});
