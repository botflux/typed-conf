import type { BaseSchema } from "../schemes/base.js";
import type { AnySourceType, Source } from "../sources/interfaces.js";
import { getSecretState } from "./schema-modifiers.js";

export function collectSecretPaths(
	schema: BaseSchema<unknown, Source<AnySourceType>>,
): string[] {
	return collect(schema, [], false);
}

function collect(
	schema: BaseSchema<unknown, Source<AnySourceType>>,
	path: string[],
	inSecretContext: boolean,
): string[] {
	const state = getSecretState(schema);
	const currentSecretContext =
		state === "secret" ? true : state === "cleartext" ? false : inSecretContext;

	if (schema.structure.kind === "leaf") {
		if (currentSecretContext) {
			return [path.join(".")];
		}
		return [];
	}

	const paths: string[] = [];
	for (const [key, childSchema] of Object.entries(schema.structure.children)) {
		paths.push(...collect(childSchema, [...path, key], currentSecretContext));
	}
	return paths;
}
