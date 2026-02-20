import { describe, expect, it } from "vitest";
import { load } from "../load.js";
import { object } from "../schemes/object.js";
import { string } from "../schemes/string.js";
import { envSource } from "../sources/env/factory.js";

describe("load config from envs", () => {
	it("should load a string from an env variable", async () => {
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
