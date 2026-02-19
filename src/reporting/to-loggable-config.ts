import { getOrigin } from "../sources/origin.js";

export function toLoggableConfig(
	config: Record<string, unknown>,
): Record<string, unknown> {
	const origins = getOrigin(config);
	const result: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(config)) {
		if (value !== null && typeof value === "object" && !Array.isArray(value)) {
			result[key] = toLoggableConfig(value as Record<string, unknown>);
		} else if (value !== null && value !== undefined) {
			const origin = origins?.[key];
			result[key] = origin ? `${value} (${origin})` : String(value);
		}
	}

	return result;
}
