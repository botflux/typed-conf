import type { BaseSchema } from "../schemes/base.js";
import type { AnySourceType, Source } from "../sources/interfaces.js";
import { getOrigin } from "../sources/origin.js";
import { collectSecretPaths } from "./collect-secret-paths.js";
import slowRedact from "slow-redact";

export function toLoggableConfig(
	config: Record<string, unknown>,
	schema: BaseSchema<unknown, Source<AnySourceType>>,
): Record<string, unknown> {
	const secretPaths = collectSecretPaths(schema);
	const redact = slowRedact({
		paths: secretPaths,
		censor: "REDACTED",
		serialize: false,
	});
	const redactedConfig = redact(config) as Record<string, unknown> & {
		restore?: () => unknown;
	};

	// Remove the restore function that slow-redact adds
	delete redactedConfig.restore;

	return formatConfig(config, redactedConfig);
}

function formatConfig(
	originalConfig: Record<string, unknown>,
	redactedConfig: Record<string, unknown>,
): Record<string, unknown> {
	const origins = getOrigin(originalConfig);
	const result: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(redactedConfig)) {
		if (value !== null && typeof value === "object" && !Array.isArray(value)) {
			const originalNested = originalConfig[key] as Record<string, unknown>;
			result[key] = formatConfig(
				originalNested,
				value as Record<string, unknown>,
			);
		} else if (value !== null && value !== undefined) {
			const origin = origins?.[key];
			result[key] = origin ? `${value} (${origin})` : String(value);
		}
	}

	return result;
}
