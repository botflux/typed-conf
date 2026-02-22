import { describe, expect, it } from "vitest";
import { collectSecretPaths } from "./collect-secret-paths.js";
import { object } from "../schemes/object.js";
import { string } from "../schemes/string.js";
import { number } from "../schemes/number.js";
import { secret } from "./schema-modifiers.js";
import { clearText } from "./schema-modifiers.js";

describe("collectSecretPaths", () => {
	it("should return empty array for schema with no secrets", () => {
		// Given
		const schema = object({
			host: string(),
			port: number(),
		});

		// When
		const paths = collectSecretPaths(schema);

		// Then
		expect(paths).toEqual([]);
	});

	it("should return path for a secret leaf", () => {
		// Given
		const schema = object({
			mySecret: secret(string()),
		});

		// When
		const paths = collectSecretPaths(schema);

		// Then
		expect(paths).toEqual(["mySecret"]);
	});

	it("should return paths for all leaves inside a secret object", () => {
		// Given
		const schema = object({
			url: string(),
			auth: secret(
				object({
					username: string(),
					password: string(),
				}),
			),
		});

		// When
		const paths = collectSecretPaths(schema);

		// Then
		expect(paths).toEqual(["auth.username", "auth.password"]);
	});

	it("should exclude clearText leaves inside a secret object", () => {
		// Given
		const schema = object({
			url: string(),
			auth: secret(
				object({
					username: string(),
					password: string(),
					retries: clearText(number()),
				}),
			),
		});

		// When
		const paths = collectSecretPaths(schema);

		// Then
		expect(paths).toEqual(["auth.username", "auth.password"]);
	});

	it("should handle deeply nested secrets", () => {
		// Given
		const schema = object({
			database: object({
				connection: secret(
					object({
						host: clearText(string()),
						password: string(),
					}),
				),
			}),
		});

		// When
		const paths = collectSecretPaths(schema);

		// Then
		expect(paths).toEqual(["database.connection.password"]);
	});

	it("should be able to disable secret when a branch is clear text", () => {
		// Given
		const schema = secret(
			object({
				username: string(),
				password: string(),
				options: clearText(
					object({
						sslVersion: string(),
					}),
				),
			}),
		);

		// When
		const paths = collectSecretPaths(schema);

		// Then
		expect(paths).toEqual(["username", "password"]);
	});
});
