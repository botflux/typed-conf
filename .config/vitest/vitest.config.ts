import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		projects: [
			{
				extends: true,
				test: {
					name: "unit",
					include: ["src/**/*.unit.ts"],
				},
			},
			{
				extends: true,
				test: {
					name: "integration",
					include: ["src/**/*.integration.ts"],
				},
			},
			{
				extends: true,
				test: {
					name: "acceptance",
					include: ["src/tests/**/*.uat.ts"],
				},
			},
		],
	},
});
