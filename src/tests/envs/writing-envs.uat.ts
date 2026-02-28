import {describe, expect, it} from "vitest";
import {temporaryDirectory} from "../../temporary-directory.js";
import { $ } from 'execa'

describe("writing envs", () => {
	it.skip("should be able to output all the envs", async () => {
		// Given
		await using tmpDir = await temporaryDirectory({ sourceDir: 'fixtures/bootstrap-envs' })

		// When
		const result = await $('typed-conf bootstrap envs', { cwd: tmpDir.path })

		// Then
		expect(result.stdout).toMatchFileSnapshot('bootstrap-envs.envs.txt')
	});

	it.skip("should be able to output the aliases", () => {
		// Given
		// When
		// Then
	});

	it.skip("should be able to output the descriptions", () => {
		// Given
		// When
		// Then
	});

	it.skip("should be able to output the defauts as comments", () => {
		// Given
		// When
		// Then
	});
});
