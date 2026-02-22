import { describe, it, expect } from "vitest";
import { envSource } from "../sources/env/factory.js";
import { string } from "../schemes/string.js";
import { load } from "../load.js";
import { object } from "../schemes/object.js";
import { toLoggableConfig } from "../reporting/to-loggable-config.js";
import { number } from "../schemes/number.js";

describe("reporting origin", () => {
	it("should be able to report the origin of a config entry", async () => {
		// Given
		const fakeEnvs = { HOST: "localhost" };
		const source = envSource();

		const schema = object({
			host: string([source.alias("HOST")]),
		});

		const config = await load(schema, {
			inject: { envs: fakeEnvs },
		});

		// When
		const loggableConfig = toLoggableConfig(config, schema);

		// Then
		expect(loggableConfig).toEqual({
			host: "localhost (envs:HOST)",
		});
	});

	it("should be able to report the origin of a default entry", async () => {
		// Given
		const fakeEnvs = { HOST: "localhost" };
		const source = envSource();

		const schema = object({
			host: string([source.alias("HOST")]),
			port: number({ default: 3000 }),
		});

		const config = await load(schema, {
			inject: { envs: fakeEnvs },
		});

		// When
		const loggableConfig = toLoggableConfig(config, schema);

		// Then
		expect(loggableConfig).toEqual({
			host: "localhost (envs:HOST)",
			port: "3000 (default)",
		});
	});
});
