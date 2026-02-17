import type {BaseSchema} from "./base.js";

export type ObjectSchema<Spec extends Record<string, BaseSchema<unknown>>> = BaseSchema<SpecToType<Spec>> & {
  spec: Spec
}

export type SpecToType<Spec extends Record<string, BaseSchema<unknown>>> = {
  readonly [Key in keyof Spec]: Spec[Key]["type"]
}

export function object<Spec extends Record<string, BaseSchema<unknown>>>(spec: Spec): ObjectSchema<Spec> {
  return {
    type: {} as unknown as SpecToType<Spec>,
    schema: Object(specToTypeboxSpec(spec)),
    spec,
  }
}

function specToTypeboxSpec(spec: Record<string, BaseSchema<unknown>>) {
  return Object.fromEntries(Object.entries(spec).map(([key, schema]) => [key, schema.schema]))
}