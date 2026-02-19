import { describe, it, expectTypeOf } from "vitest";
import type { Source, SourceType } from "../sources/interfaces.js";
import { string } from "./string.js";
import { object } from "./object.js";

describe("string", () => {
	it("should be able to infer the sources registered in the aliases", () => {
		// Given
		type SourceType1 = SourceType<
			"source1",
			{ s1: string },
			any,
			{ inject1: string }
		>;
		type SourceType2 = SourceType<
			"source2",
			{ s2: string },
			any,
			{ inject2: string }
		>;

		const source1 = {
			alias(opts: { s1: string }) {
				return { source: this as Source<SourceType1>, opts };
			},
		} as unknown as Source<SourceType1>;
		const source2 = {
			alias(opts: { s2: string }) {
				return { source: this as Source<SourceType2>, opts };
			},
		} as unknown as Source<SourceType2>;

		// When
		const schema = object({
			host: string([source1.alias({ s1: "" }), source2.alias({ s2: "" })]),
		});

		// Then
		expectTypeOf(schema["sources"]).toEqualTypeOf<
			Array<Source<SourceType1> | Source<SourceType2>>
		>();
	});
});
