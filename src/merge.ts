import { appendOrigin, getOrigin } from "./sources/origin.js";

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Merge multiple config objects with precedence (first config has highest precedence).
 * Origin metadata is preserved from the winning value's source.
 * Nested objects are deep merged.
 * Arrays are not merged - first defined array wins.
 */
export function mergeConfigs(
	configs: Record<string, unknown>[],
): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const config of configs) {
		mergeInto(result, config);
	}

	return result;
}

/**
 * Merge source into target, only adding keys that don't exist in target.
 * Recursively deep merges nested objects.
 */
function mergeInto(
	target: Record<string, unknown>,
	source: Record<string, unknown>,
): void {
	const sourceOrigins = getOrigin(source);

	for (const [key, sourceValue] of Object.entries(source)) {
		if (sourceValue === undefined) {
			continue;
		}

		const targetValue = target[key];

		if (targetValue === undefined) {
			if (isPlainObject(sourceValue)) {
				const nested: Record<string, unknown> = {};
				target[key] = nested;
				mergeInto(nested, sourceValue);
			} else {
				target[key] = sourceValue;
				const origin = sourceOrigins?.[key];
				if (origin !== undefined) {
					appendOrigin(target, key, origin);
				}
			}
		} else if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
			mergeInto(targetValue, sourceValue);
		}
	}
}
