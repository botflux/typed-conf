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
 * Simplify/flatten an intersection type into a single object type.
 */
type Simplify<T> = { [K in keyof T]: T[K] };

/**
 * Extract source types where inject opts have all optional properties.
 */
type OptionalInjectSources<T extends AnySourceType[]> = {
	[K in T[number] as AllOptional<K["Inject"]> extends true
		? K["name"]
		: never]?: K["Inject"];
};

/**
 * Extract source types where inject opts have required properties.
 */
type RequiredInjectSources<T extends AnySourceType[]> = {
	[K in T[number] as AllOptional<K["Inject"]> extends true
		? never
		: K["name"]]: K["Inject"];
};

/**
 * Maps a tuple of SourceTypes to an object where keys are source names
 * and values are their inject options. If all inject properties are optional,
 * the key itself becomes optional.
 */
export type InjectOpts<T extends AnySourceType[]> = Simplify<
	OptionalInjectSources<T> & RequiredInjectSources<T>
>;

/**
 * Checks if all sources in the tuple have all-optional inject opts.
 */
type AllSourcesOptional<T extends AnySourceType[]> =
	(T[number] extends infer S
		? S extends AnySourceType
			? AllOptional<S["Inject"]> extends true
				? true
				: false
			: never
		: never) extends true
		? true
		: false;

/**
 * Maps a tuple of SourceTypes to load options.
 * The inject property is optional if all sources have all-optional inject opts.
 */
export type LoadOpts<T extends AnySourceType[]> =
	AllSourcesOptional<T> extends true
		? { inject?: InjectOpts<T> }
		: { inject: InjectOpts<T> };