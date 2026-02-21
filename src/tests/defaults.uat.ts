import { describe, expect, it } from "vitest";
import { envSource } from "../sources/env/factory.js";
import { object } from "../schemes/object.js";
import { number } from "../schemes/number.js";
import { load } from "../load.js";

describe("default value", () => {
	it("should be able to assign default values", async () => {
		// Given
		const fakeEnvs = {};
		const source = envSource();
		const schema = object({
			port: number({
				default: 3000,
				aliases: [source.alias("PORT")],
			}),
		});

		// When
		const config = await load(schema, { inject: { envs: fakeEnvs } });

		// Then
		expect(config).toEqual({ port: 3000 });
	});
});
