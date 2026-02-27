import { cp, mkdir, rm } from "node:fs/promises";
import { randomBytes } from "node:crypto";

export type TemporaryDirectory = {
	path: string;
} & AsyncDisposable;

export type TemporaryDirectoryOptions = {
	sourceDir?: string;
	inject?: {
		envs?: Record<string, string | undefined>;
	};
};

const TMP_DIR_ROOT = ".tmp-dir";

export async function temporaryDirectory(
	options: TemporaryDirectoryOptions = {},
): Promise<TemporaryDirectory> {
	const { inject: { envs = process.env } = {}, sourceDir } = options;
	const uniqueName = `${Date.now()}-${randomBytes(4).toString("hex")}`;
	const path = `${TMP_DIR_ROOT}/${uniqueName}`;

	await mkdir(path, { recursive: true });

	if (sourceDir) {
		await cp(sourceDir, path, { recursive: true });
	}

	return {
		path,
		[Symbol.asyncDispose]: async () => {
			if (envs.KEEP_TMP_DIR) {
				return;
			}
			await rm(path, { recursive: true, force: true });
		},
	};
}
