import { describe, expect, it } from "vitest";
import { appendOrigin } from "../sources/origin.js";
import { toLoggableConfig } from "./to-loggable-config.js";
import { object } from "../schemes/object.js";
import { number } from "../schemes/number.js";
import { string } from "../schemes/string.js";

describe("toLoggableConfig", () => {
	it("should be able to merge config value and their origin", () => {
		// Given
		const config = { port: 3000, host: "localhost" };
		const schema = object({
			port: number(),
			host: string(),
		});

		appendOrigin(config, "port", "env:PORT");
		appendOrigin(config, "host", "env:HOST");

		// When
		const loggableConfig = toLoggableConfig(config, schema);

		// Then
		expect(loggableConfig).toEqual({
			port: "3000 (env:PORT)",
			host: "localhost (env:HOST)",
		});
	});

	it("should be able to merge config value and their origin even with nested configs", () => {
		// Given
		const db = { url: "postgres://localhost" };
		appendOrigin(db, "url", "env:DB_URL");

		const config = { port: 3000, host: "localhost", db };
		const schema = object({
			port: number(),
			host: string(),
			db: object({
				url: string(),
			}),
		});

		appendOrigin(config, "port", "env:PORT");
		appendOrigin(config, "host", "env:HOST");

		// When
		const loggableConfig = toLoggableConfig(config, schema);

		// Then
		expect(loggableConfig).toEqual({
			port: "3000 (env:PORT)",
			host: "localhost (env:HOST)",
			db: {
				url: "postgres://localhost (env:DB_URL)",
			},
		});
	});

	it("should be able to skip undefined config value", () => {
		// Given
		const config = { url: undefined };
		const schema = object({
			url: string(),
		});

		// When
		const loggableConfig = toLoggableConfig(config, schema);

		// Then
		expect(loggableConfig).toEqual({});
	});

	it("should be able to skip null config value", () => {
		// Given
		const config = { url: null };
		const schema = object({
			url: string(),
		});

		// When
		const loggableConfig = toLoggableConfig(config, schema);

		// Then
		expect(loggableConfig).toEqual({});
	});
});
