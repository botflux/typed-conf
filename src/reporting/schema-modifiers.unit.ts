import { describe, expect } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { clearText, getSecretState, secret } from "./schema-modifiers.js";
import { string } from "../schemes/string.js";
import { number } from "../schemes/number.js";

const leafSchemaArb = fc.oneof(fc.constant(string()), fc.constant(number()));

describe("secrecy", () => {
	describe("secret", () => {
		test.prop({ schema: leafSchemaArb })(
			"getSecretState returns 'secret' for any secret-wrapped schema",
			({ schema }) => {
				expect(getSecretState(secret(schema))).toBe("secret");
			},
		);

		test.prop({ schema: leafSchemaArb })(
			"secret does not mutate the original schema",
			({ schema }) => {
				// Given
				const frozen = Object.freeze(schema);

				// When / Then
				expect(() => secret(frozen)).not.toThrow(/object is not extensible/);
			},
		);
	});

	describe("clearText", () => {
		test.prop({ schema: leafSchemaArb })(
			"getSecretState returns 'cleartext' for any clearText-wrapped schema",
			({ schema }) => {
				expect(getSecretState(clearText(schema))).toBe("cleartext");
			},
		);

		test.prop({ schema: leafSchemaArb })(
			"clearText does not mutate the original schema",
			({ schema }) => {
				// Given
				const frozen = Object.freeze(schema);

				// When / Then
				expect(() => clearText(frozen)).not.toThrow(/object is not extensible/);
			},
		);
	});

	describe("getSecretState", () => {
		test.prop({ schema: leafSchemaArb })(
			"returns 'inherit' for any non-wrapped schema",
			({ schema }) => {
				expect(getSecretState(schema)).toBe("inherit");
			},
		);
	});
});
