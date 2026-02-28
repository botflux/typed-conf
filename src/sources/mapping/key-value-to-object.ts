import { appendOrigin } from "../origin.js";

export type KeyValue = [pathInObject: string[], value: unknown, origin: string];

export function mapKeyValueToObject(
	keyValues: KeyValue[],
): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const [path, value, origin] of keyValues) {
		const target = setNestedValue(result, path, value);
		if (target !== undefined) {
			appendOrigin(target.parent, target.key, origin);
		}
	}

	return result;
}

function setNestedValue(
	obj: Record<string, unknown>,
	path: string[],
	value: unknown,
): { parent: Record<string, unknown>; key: string } | undefined {
	let current = obj;
	for (let i = 0; i < path.length - 1; i++) {
		const key = path[i];
		if (key === undefined) continue;
		if (!(key in current)) {
			current[key] = {};
		}
		current = current[key] as Record<string, unknown>;
	}
	const lastKey = path[path.length - 1];
	if (lastKey === undefined) return undefined;
	current[lastKey] = value;
	return { parent: current, key: lastKey };
}
