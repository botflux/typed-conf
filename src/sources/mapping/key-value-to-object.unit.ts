import { describe, expect, it } from "vitest";
import { getOrigin } from "../origin.js";
import { mapKeyValueToObject, type KeyValue } from "./key-value-to-object.js";

describe("keyValueToObject", () => {
	it("should be able to map a key value data structure to an object", () => {
		// Given
		const keyValue: KeyValue[] = [
			[["host"], "localhost", "envs:HOST"],
			[["port"], 3000, "envs:PORT"],
		];

		// When
		const result = mapKeyValueToObject(keyValue);

		// Then
		expect(result).toEqual({ host: "localhost", port: 3000 });
		expect(getOrigin(result)).toEqual({ host: "envs:HOST", port: "envs:PORT" });
	});

	it("should be able to map key value data structure with nested entries to an object", () => {
		// Given
		const keyValue: KeyValue[] = [
			[["db", "url"], "mongodb://localhost:27017", "envs:DB_URL"],
		];

		// When
		const result = mapKeyValueToObject(keyValue);

		// Then
		expect(result).toEqual({ db: { url: "mongodb://localhost:27017" } });
		expect(getOrigin(result.db as Record<string, unknown>)).toEqual({
			url: "envs:DB_URL",
		});
	});
});
