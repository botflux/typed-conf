import { describe, expect, it } from "vitest";
import { envSource } from "./factory.js";
import { object } from "../../schemes/object.js";
import { string } from "../../schemes/string.js";
import { getOrigin } from "../origin.js";
import { AmbiguousEnvNameError } from "./ambiguous-env-name.error.js";

describe("env source", function () {
	describe("load all from schema", function () {
		describe("base env sources tests and implicit loading", function () {
			it("should be able to load config from envs", async function () {
				// Given
				const fakeEnvs = { HOST: "localhost" };
				const source = envSource({ mode: "implicit" });
				const schema = object({
					host: string(),
				});

				// When
				const result = await source.loadFromSchema(schema, undefined, fakeEnvs);

				// Then
				expect(result).toEqual({ host: "localhost" });
			});

			it("should be able return nothing given the env is missing", async function () {
				// Given
				const fakeEnvs = {};
				const source = envSource({ mode: "implicit" });
				const schema = object({
					host: string(),
				});

				// When
				const result = await source.loadFromSchema(schema, undefined, fakeEnvs);

				// Then
				expect(result).toEqual({});
			});

			it("should be able to load multiple envs at the same time", async function () {
				// Given
				const fakeEnvs = { HOST: "localhost", DB_URL: "postgres://localhost" };
				const source = envSource({ mode: "implicit" });
				const schema = object({
					host: string(),
					dbUrl: string(),
				});

				// When
				const result = await source.loadFromSchema(schema, undefined, fakeEnvs);

				// Then
				expect(result).toEqual({
					host: "localhost",
					dbUrl: "postgres://localhost",
				});
			});

			describe("nested objects", function () {
				it("should be able to load envs from a nested schema", async function () {
					const fakeEnvs = { DB_URL: "postgres://localhost" };
					const source = envSource({ mode: "implicit" });
					const schema = object({
						db: object({ url: string() }),
					});

					// When
					const result = await source.loadFromSchema(
						schema,
						undefined,
						fakeEnvs,
					);

					// Then
					expect(result).toEqual({ db: { url: "postgres://localhost" } });
				});

				it("should be able to throw given the implicitly named env is already used", async function () {
					const fakeEnvs = { DB_URL: "postgres://localhost" };
					const source = envSource({ mode: "implicit" });
					const schema = object({
						db: object({ url: string() }),
						dbUrl: string(),
					});

					// When
					const result = await source
						.loadFromSchema(schema, undefined, fakeEnvs)
						.catch((e) => e);

					// Then
					expect(result).toEqual(
						new AmbiguousEnvNameError("DB_URL", "db.url", "dbUrl"),
					);
				});
			});
		});

		/**
		 * Aliases helps to give another name to envs.
		 * This is useful when you are integrating the library within an existing codebase, you define your config schema
		 * with aliases to make the old envs compatible with the schema.
		 */
		describe("aliases", function () {
			it("should be able to load aliases", async function () {
				// Given
				const fakeEnvs = { OLD_HOST_ENV: "localhost" };
				const source = envSource({ mode: "implicit" });
				const schema = object({
					host: string([source.alias("OLD_HOST_ENV")]),
				});

				// When
				const result = await source.loadFromSchema(schema, undefined, fakeEnvs);

				// Then
				expect(result).toEqual({ host: "localhost" });
			});

			it("should be able to pick the implicitly named env first", async function () {
				// Given
				const fakeEnvs = { HOST: "new.localhost", OLD_HOST_ENV: "localhost" };
				const source = envSource({ mode: "implicit" });
				const schema = object({
					host: string([source.alias("OLD_HOST_ENV")]),
				});

				// When
				const result = await source.loadFromSchema(schema, undefined, fakeEnvs);

				// Then
				expect(result).toEqual({ host: "new.localhost" });
			});

			it("should be able to load aliases in order", async function () {
				// Given
				const fakeEnvs = {
					OLD_HOST_ENV: "old.localhost",
					SECOND_OLD_HOST_ENV: "old.old.localhost",
				};
				const source = envSource({ mode: "implicit" });
				const schema = object({
					host: string([
						source.alias("SECOND_OLD_HOST_ENV"),
						source.alias("OLD_HOST_ENV"),
					]),
				});

				// When
				const result = await source.loadFromSchema(schema, undefined, fakeEnvs);

				// Then
				expect(result).toEqual({ host: "old.old.localhost" });
			});
		});

		/**
		 * Implicit loading is cool if you are lazy to name every env, like you are integrating this library
		 * onto a brand-new project.
		 *
		 * On the other hand, since the names of the envs are never explicitly set, you can't search for the env's usage
		 * in the codebase.
		 *
		 * When I'm new to a codebase, and there is a problem that I suspect is a misconfiguration, I like being able
		 * to just do a wide search in the codebase to find an env's usage.
		 *
		 * That's the point where explicit loading comes in handy; since you are required to give a name to each env,
		 * you can search them easily.
		 */
		describe.skip("explicit loading", function () {
			it("should be able to disable implicit loading", async function () {
				// Given
				const fakeEnvs = { HOST: "new.localhost", OLD_HOST_ENV: "localhost" };
				const source = envSource({ mode: "explicit" });
				const schema = object({
					host: string([source.alias("OLD_HOST_ENV")]),
				});

				// When
				const result = await source.loadFromSchema(schema, undefined, fakeEnvs);

				// Then
				expect(result).toEqual({ host: "localhost" });
			});

			it("should be able to not load envs given explicit mode is enabled and no aliases were provided", async function () {
				// Given
				const fakeEnvs = { HOST: "new.localhost", OLD_HOST_ENV: "localhost" };
				const source = envSource({ mode: "explicit" });
				const schema = object({
					host: string(),
				});

				// When
				const result = await source.loadFromSchema(schema, undefined, fakeEnvs);

				// Then
				expect(result).toEqual({});
			});
		});

		/**
		 * It is important to keep track of which alias was used to load a config entry.
		 */
		describe.skip("source tracking", function () {
			it("should be able to track env's origin", async function () {
				// Given
				const fakeEnvs = { HOST: "new.localhost", OLD_HOST_ENV: "localhost" };
				const source = envSource({ mode: "implicit" });
				const schema = object({
					host: string([source.alias("OLD_HOST_ENV")]),
				});

				// When
				const result = await source.loadFromSchema(schema, undefined, fakeEnvs);

				// Then
				expect(getOrigin(result)).toEqual({ host: "envs:HOST" });
			});

			it("should be able to track env alias origin", async function () {
				// Given
				const fakeEnvs = { OLD_HOST_ENV: "localhost" };
				const source = envSource({ mode: "implicit" });
				const schema = object({
					host: string([source.alias("OLD_HOST_ENV")]),
				});

				// When
				const result = await source.loadFromSchema(schema, undefined, fakeEnvs);

				// Then
				expect(getOrigin(result)).toEqual({ host: "envs:OLD_HOST_ENV" });
			});
		});
	});
});
