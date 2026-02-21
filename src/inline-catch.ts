export function inlineCatchSync<T>(
	fn: () => T,
): [T, undefined] | [undefined, { error: unknown }] {
	try {
		return [fn(), undefined];
	} catch (error) {
		return [undefined, { error }];
	}
}
