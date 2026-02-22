import type { BaseSchema } from "../schemes/base.js";
import type { AnySourceType, Source } from "../sources/interfaces.js";

const kSecret = Symbol("secret");

export type SecretState = "secret" | "cleartext" | "inherit";

export function secret<
	Schema extends BaseSchema<unknown, Source<AnySourceType>>,
>(schema: Schema): Schema {
	return { ...schema, [kSecret]: true };
}

export function clearText<
	Schema extends BaseSchema<unknown, Source<AnySourceType>>,
>(schema: Schema): Schema {
	return { ...schema, [kSecret]: false };
}

export function getSecretState(
	schema: BaseSchema<unknown, Source<AnySourceType>>,
): SecretState {
	if (!(kSecret in schema)) {
		return "inherit";
	}
	return schema[kSecret] ? "secret" : "cleartext";
}
