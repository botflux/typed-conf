import type {BaseSchema} from "./base.js";
import {isObject} from "./object.js";
import {isArray} from "./array.js";
import type {UnionSchema} from "./union.js";
import type {FatUnionSchema} from "./fat-union.unit.js";
import type {IntersectionSchema} from "./intersection.js";

export const kIndex = Symbol('index')

function isIntersection(schema: BaseSchema<unknown> | IntersectionSchema<BaseSchema<unknown>>): schema is IntersectionSchema<BaseSchema<unknown>> {
  return 'type' in schema && schema.type === 'intersection'
}

function isUnion(schema: BaseSchema<unknown> | UnionSchema<BaseSchema<unknown>>): schema is UnionSchema<BaseSchema<unknown>> {
  return 'type' in schema && schema.type === 'union'
}

function isFatUnion(schema: BaseSchema<unknown> | FatUnionSchema<Record<string, BaseSchema<unknown>>>): schema is FatUnionSchema<Record<string, BaseSchema<unknown>>> {
  return 'type' in schema && schema.type === 'fat_union'
}

export function *walk(schema: BaseSchema<unknown>, path: (string | Symbol)[] = []): Generator<[ (string | Symbol)[], BaseSchema<unknown> ]> {
  yield [path, schema]

  if (isObject(schema)) {
    for (const [key, child] of Object.entries(schema.props)) {
      yield* walk(child, [ ...path, key ])
    }
  }

  if (isArray(schema)) {
    yield* walk(schema.items, [ ...path, kIndex ])
  }

  if (isIntersection(schema)) {
    for (const child of schema.schemes) {
      yield* walk(child, path)
    }
  }

  if (isUnion(schema)) {
    for (const child of schema.schemes) {
      yield* walk(child, path)
    }
  }

  if (isFatUnion(schema)) {
    for (const child of Object.values(schema.schemes)) {
      yield* walk(child, path)
    }
  }
}
