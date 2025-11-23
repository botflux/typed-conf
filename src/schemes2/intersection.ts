import {type BaseSchema, kType} from "./base.js";
import type {Alias} from "../schemes/base.js";

type Prettier<T> = {
  [K in keyof T]: T[K]
} & {}
type UnwrapSchemaType<S extends BaseSchema<unknown>> = S extends BaseSchema<infer T> ? T : never
type UnionToIntersection<U> =
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void
    ? I
    : never
export type IntersectionSchema<S extends BaseSchema<unknown>> =
  BaseSchema<Prettier<UnionToIntersection<UnwrapSchemaType<S>>>>
  & {
  type: 'intersection'
  schemes: S[]
}
export type IntersectionOpts = {
  aliases?: Alias[]
}

export function intersection<S extends BaseSchema<unknown>>(schemes: S[], opts: IntersectionOpts = {}): IntersectionSchema<S> {
  const {aliases = []} = opts

  return {
    type: 'intersection',
    schemes,
    aliases,
    [kType]: "" as unknown as UnionToIntersection<UnwrapSchemaType<S>>,
    beforeRefSchema: {
      type: 'object',
      allOf: schemes.map(s => s.beforeRefSchema)
    },
    afterRefSchema: {
      type: 'object',
      allOf: schemes.map(s => s.afterRefSchema ?? s.beforeRefSchema)
    },
  }
}