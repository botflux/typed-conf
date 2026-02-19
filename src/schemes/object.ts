import type { AnySourceType, Source } from "../sources/interfaces.js";
import type { BaseSchema } from "./base.js";

// Extract the Source type from a BaseSchema
type ExtractSources<S> = S extends BaseSchema<unknown, infer Src> ? Src : never;

// Union of all source types from all schemas in a spec
type SpecToSources<
	Spec extends Record<string, BaseSchema<unknown, Source<AnySourceType>>>,
> = ExtractSources<Spec[keyof Spec]>;

export type SpecToType<
	Spec extends Record<string, BaseSchema<unknown, Source<AnySourceType>>>,
> = {
	readonly [Key in keyof Spec]: Spec[Key]["type"];
};

export type ObjectSchema<
	Spec extends Record<string, BaseSchema<unknown, Source<AnySourceType>>>,
> = BaseSchema<SpecToType<Spec>, SpecToSources<Spec>>;

export function object<
	Spec extends Record<string, BaseSchema<unknown, Source<AnySourceType>>>,
>(spec: Spec): ObjectSchema<Spec> {
	return {
		type: {} as unknown as SpecToType<Spec>,
		schema: Object(specToTypeboxSpec(spec)),
		structure: { kind: "branch", children: spec },
		sources: Object.values(spec).flatMap(
			(child) => child.sources,
		) as SpecToSources<Spec>[],
	};
}

function specToTypeboxSpec(
	spec: Record<string, BaseSchema<unknown, Source<AnySourceType>>>,
) {
	return Object.fromEntries(
		Object.entries(spec).map(([key, schema]) => [key, schema.schema]),
	);
}
