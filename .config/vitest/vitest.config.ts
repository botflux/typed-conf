import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		exclude: [ ".stryker-tmp" ],
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
			{
				extends: true,
				test: {
					typecheck: {
						enabled: true,
					},
					name: 'type',
					include: ["src/**/*.test-d.ts"],
				}
			}
		],
	},
});
