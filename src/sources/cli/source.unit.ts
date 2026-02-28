import { describe, expect, it } from "vitest";
import { string } from "../../schemes/string.js";
import { object } from "../../schemes/object.js";
import { AmbiguousCliArgError } from "./ambiguous-cli-arg.error.js";
import { cliSource } from "./factory.js";

describe("cli source", () => {
	describe("load all from schema", () => {
		describe("base cli sources tests and implicit loading", () => {
			it("should be able to load config from envs", async () => {
				// Given
				const fakeArgv = ["--host", "localhost"];
				const source = cliSource({ mode: "implicit" });

				const schema = object({
					host: string(),
				});

				// When
				const result = await source.loadFromSchema(schema, undefined, fakeArgv);

				// Then
				expect(result).toEqual({ host: "localhost" });
			});

			it("should be able to return nothing given the arg is missing", async () => {
				// Given
				const fakeArgv: string[] = [];
				const source = cliSource({ mode: "implicit" });

				const schema = object({
					host: string(),
				});

				// When
				const result = await source.loadFromSchema(schema, undefined, fakeArgv);

				// Then
				expect(result).toEqual({});
			});

			it("should be able to load multiple args at the same time", async () => {
				// Given
				const fakeArgv = [
					"--host",
					"localhost",
					"--db-url",
					"postgres://localhost",
				];
				const source = cliSource({ mode: "implicit" });

				const schema = object({
					host: string(),
					dbUrl: string(),
				});

				// When
				const result = await source.loadFromSchema(schema, undefined, fakeArgv);

				// Then
				expect(result).toEqual({
					host: "localhost",
					dbUrl: "postgres://localhost",
				});
			});

			describe("nested objects", () => {
				it("should be able to nested schema from cli args", async () => {
					// Given
					const fakeArgv = ["--db.url", "postgres://localhost"];
					const source = cliSource({ mode: "implicit" });

					const schema = object({
						db: object({
							url: string(),
						}),
					});

					// When
					const result = await source.loadFromSchema(
						schema,
						undefined,
						fakeArgv,
					);

					// Then
					expect(result).toEqual({
						db: {
							url: "postgres://localhost",
						},
					});
				});

				it("should be able to throw given an implicitly named arg is already used", async () => {
					// Given
					const fakeArgv = ["--db.url", "postgres://localhost"];
					const source = cliSource({ mode: "implicit" });
					const schema = object({
						"db.url": string(),
						db: object({
							url: string(),
						}),
					});

					// When
					const result = await source
						.loadFromSchema(schema, undefined, fakeArgv)
						.catch((e: unknown) => e);

					// Then
					expect(result).toEqual(
						new AmbiguousCliArgError("--db.url", "db.url", "db.url"),
					);
				});
			});
		});
	});
});
