import { describe, expect, it } from "vitest";

function object(param: { port: any }) {}

function number(param: any[]) {}

function envSource() {
	return {
		alias(name: string) {
			return name;
		},
	};
}

async function load(
	schema: void,
	param2: { inject: { envs: { PORT: string } } },
) {}

describe("load config from envs", () => {
	it.skip("should load a number from an env variable", async () => {
		// Given
		const envs = envSource();

		const schema = object({
			port: number([envs.alias("PORT")]),
		});

		// When
		const config = await load(schema, {
			inject: {
				envs: { PORT: "3000" },
			},
		});

		// Then
		expect(config).toEqual({ port: 3000 });
	});
});
