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
			writable: true,
			configurable: true,
		});
	}
	origins[key] = origin;
}
