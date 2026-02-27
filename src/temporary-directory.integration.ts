import { describe, expect, it } from "vitest";
import { temporaryDirectory } from "./temporary-directory.js";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";

describe("temporaryDirectory", () => {
	it("should create a directory in .tmp-dir/", async () => {
		// Given
		// When
		await using tempDir = await temporaryDirectory();

		// Then
		await expect(access(tempDir.path)).resolves.toBeUndefined();
	});

	it("should copy source directory contents when provided", async () => {
		// Given
		await using sourceDir = await temporaryDirectory();
		await writeFile(`${sourceDir.path}/test.txt`, "hello world");
		await mkdir(`${sourceDir.path}/subdir`);
		await writeFile(`${sourceDir.path}/subdir/nested.txt`, "nested content");

		// When
		await using tempDir = await temporaryDirectory({
			sourceDir: sourceDir.path,
		});

		// Then
		await expect(readFile(`${tempDir.path}/test.txt`, "utf-8")).resolves.toBe(
			"hello world",
		);
		await expect(
			readFile(`${tempDir.path}/subdir/nested.txt`, "utf-8"),
		).resolves.toBe("nested content");
	});

	it("should clean up on dispose", async () => {
		// Given
		let capturedPath: string;

		// When
		{
			await using tempDir = await temporaryDirectory();
			capturedPath = tempDir.path;
			await expect(access(capturedPath)).resolves.toBeUndefined();
		}

		// Then
		await expect(access(capturedPath)).rejects.toThrow(
			expect.objectContaining({ code: "ENOENT" }),
		);
	});

	it("should skip cleanup when KEEP_TMP_DIR env is set", async (t) => {
		// Given
		let capturedPath = "";
		t.onTestFinished(async () => {
			await rm(capturedPath, { recursive: true, force: true });
		});

		// When
		{
			await using tempDir = await temporaryDirectory({
				inject: { envs: { KEEP_TMP_DIR: "true" } },
			});
			capturedPath = tempDir.path;
		}

		// Then
		await expect(access(capturedPath)).resolves.toBeUndefined();
	});
});
