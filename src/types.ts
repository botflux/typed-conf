import type { AnySourceType } from "./sources/interfaces.js";

/**
 * Checks if all properties in T are optional.
 */
type AllOptional<T> = {
	[K in keyof T]-?: undefined extends T[K] ? true : false;
}[keyof T] extends true
	? true
	: false;

/**
 * Maps a tuple of SourceTypes to an object where keys are source names
 * and values are their inject options. Sources with all-optional inject
 * properties are excluded from the result.
 */
export type InjectOpts<T extends AnySourceType[]> = {
	[K in T[number] as AllOptional<K["Inject"]> extends true
		? never
		: K["name"]]: K["Inject"];
}