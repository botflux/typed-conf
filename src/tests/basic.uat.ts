import { describe, expect, it } from "vitest";
import { envSource } from "../sources/env/factory.js";
import { object } from "../schemes/object.js";
import { string } from "../schemes/string.js";
import { load } from "../load.js";

describe("load config from envs", () => {
	it("should load a number from an env variable", async () => {
		// Given
		const envs = envSource();

		const schema = object({
			host: string([envs.alias("HOST")]),
		});

		// When
		const config = await load(schema, {
			inject: {
				envs: { HOST: "localhost" },
			},
		});

		// Then
		expect(config).toEqual({ host: "localhost" });
	});
});
