const kOrigin = Symbol("origin");

export type Origin = Record<string, string>;

export function getOrigin(
	obj: Record<string | symbol, unknown>,
): Origin | undefined {
	return obj[kOrigin] as Origin | undefined;
}

export function appendOrigin(obj: object, key: string, origin: string): void {
	let origins = getOrigin(obj as Record<string | symbol, unknown>);
	if (origins === undefined) {
		origins = {};
		Object.defineProperty(obj, kOrigin, {
			value: origins,
			enumerable: false,
			// Disable this mutant because it is an implementation detail that doesn't matter.
			// Stryker disable next-line all
			writable: true,
			// Disable this mutant because it is an implementation detail that doesn't matter.
			// Stryker disable next-line all
			configurable: true,
		});
	}
	origins[key] = origin;
}

export function origins(records: Record<string, string>) {
	return {
		[kOrigin]: records,
	};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function assignOriginToAllProperties(
	obj: Record<string, unknown>,
	origin: string,
): void {
	for (const [key, value] of Object.entries(obj)) {
		if (value === undefined) {
			continue;
		}

		if (isPlainObject(value)) {
			assignOriginToAllProperties(value, origin);
		} else {
			appendOrigin(obj, key, origin);
		}
	}
}
