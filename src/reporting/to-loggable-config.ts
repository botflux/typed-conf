import type { BaseSchema } from "../schemes/base.js";
import type { AnySourceType, Source } from "../sources/interfaces.js";
import { getOrigin } from "../sources/origin.js";
import { collectSecretPaths } from "./collect-secret-paths.js";

export function toLoggableConfig(
	config: Record<string, unknown>,
	schema: BaseSchema<unknown, Source<AnySourceType>>,
): Record<string, unknown> {
	const secretPaths = new Set(collectSecretPaths(schema));
	return formatConfig(config, [], secretPaths);
}

function formatConfig(
	config: Record<string, unknown>,
	currentPath: string[],
	secretPaths: Set<string>,
): Record<string, unknown> {
	const origins = getOrigin(config);
	const result: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(config)) {
		const path = [...currentPath, key];
		const pathString = path.join(".");
		const isSecret = secretPaths.has(pathString);

		if (isRecord(value)) {
			result[key] = formatConfig(value, path, secretPaths);
		} else if (value !== null && value !== undefined) {
			const origin = origins?.[key] ?? "unknown";
			result[key] = isSecret ? `REDACTED (${origin})` : `${value} (${origin})`;
		}
	}

	return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
