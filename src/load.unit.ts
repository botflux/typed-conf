import { describe, it, expect } from "vitest";
import type {
	Alias,
	AnySourceType,
	Source,
	SourceType,
} from "./sources/interfaces.js";
import type { BaseSchema } from "./schemes/base.js";
import { load } from "./load.js";
import { number } from "./schemes/number.js";
import { object } from "./schemes/object.js";
import { appendOrigin } from "./sources/origin.js";
import { string } from "./schemes/string.js";

type StubSourceType = SourceType<string, unknown, unknown, unknown>;

class StubSource implements Source<StubSourceType> {
	name: string = "dummy";

	#loadResult: Record<string, unknown>;

	constructor(loadResult: Record<string, unknown>) {
		this.#loadResult = loadResult;
	}

	alias(_opts: unknown): Alias<StubSourceType> {
		return {
			source: this,
			aliasOpts: {},
		};
	}

	async loadFromSchema(
		_schema: BaseSchema<unknown, Source<AnySourceType>>,
		_opts: unknown,
		_inject: unknown,
	): Promise<Record<string, unknown>> {
		return this.#loadResult;
	}
}

describe("load", () => {
	describe("validation", () => {
		it("should be able to validate config", async () => {
			// Given
			const config = { port: "foo" };
			appendOrigin(config, "port", "dummy:port");
			const source = new StubSource(config);

			// When
			const promise = load(object({ port: number([source.alias({})]) }), {
				inject: { source },
			});

			// Then
			await expect(promise).rejects.toThrow(
				new AggregateError([new Error("dummy:port must be number")]),
			);
		});

		it("should be able to throw given a required property is missing", async () => {
			// Given
			const config = { port: 3000 };
			const source = new StubSource(config);
			const schema = object({
				port: number([source.alias({})]),
				host: string([source.alias({})]),
			});

			// When
			const promise = load(schema, {
				inject: { source },
			});

			// Then
			await expect(promise).rejects.toThrow(
				new AggregateError([new Error("must have required properties host")]),
			);
		});

		it("should be able to throw multiple errors given multiple typebox errors", async () => {
			// Given
			const config = { port: "foo", anotherPort: "bar" };
			appendOrigin(config, "port", "dummy:port");
			appendOrigin(config, "anotherPort", "dummy:anotherPort");
			const source = new StubSource(config);
			const schema = object({
				port: number([source.alias({})]),
				anotherPort: number([source.alias({})]),
			});

			// When
			const promise = load(schema, {
				inject: { source },
			});

			// Then
			await expect(promise).rejects.toThrow(
				new AggregateError([
					new Error("dummy:port must be number"),
					new Error("dummy:anotherPort must be number"),
				]),
			);
		});
	});

	describe("coercion", () => {
		it("should be able to coerce values", async () => {
			// Given
			const source = new StubSource({ port: "3000" });

			// When
			const config = await load(object({ port: number([source.alias({})]) }), {});

			// Then
			expect(config).toEqual({ port: 3000 });
		});
	});
});
