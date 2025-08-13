import type {ObjectSchema, ObjectSpec} from "../schemes.js";

export type Source<K extends string, V> = {
  key: K
  load: (schema: ObjectSchema<ObjectSpec>, loaded: Record<string, unknown>, opts?: V) => Promise<unknown>
}

export type ExtractItemFromArray<T> = T extends Array<infer U> ? U : never

export type SourceToRecord<T extends Source<string, never>> = T extends Source<infer K, infer V>
  ? Record<K, V>
  : never

export type MergeUnionTypes<T> = (T extends any ? (x: T) => any : never) extends
  (x: infer R) => any ? R : never;

export type SourcesToRecord<T extends Source<string, never>[]> = Partial<MergeUnionTypes<SourceToRecord<ExtractItemFromArray<T>>>>