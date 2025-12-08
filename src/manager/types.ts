import type {Source} from "../sources/source.js";
import type {ExtractItemFromArray, MergeUnionTypes, Prettify} from "../types.js";
import type {ObjectSchema} from "../schemes/object.js";
import type {BaseSchema} from "../schemes/base.js";

export type DefaultObjectSchema = ObjectSchema<Record<string, BaseSchema<unknown>>, boolean>
export type DefaultSource = Source<string, unknown, Record<string, unknown>, unknown>
export type ManagerOpts<
  Schema extends DefaultObjectSchema,
  Sources extends DefaultSource[]
> = {
  schema: Schema
  sources: Sources
}
export type SourceToInjectRecord<T extends DefaultSource> = T extends Source<infer K, infer V, any, any> ? Record<K, V> : never
export type InjectOpts<Sources extends DefaultSource[]> = Prettify<MergeUnionTypes<SourceToInjectRecord<ExtractItemFromArray<Sources>>>>

export type SourceToParamsRecord<T extends DefaultSource> = T extends Source<infer K, any, any, infer V> ? Record<K, V> : never
export type RemoveUndefinedProps<T> = {
  [K in keyof T as T[K] extends undefined ? never : K]: T[K]
}
export type Params<Sources extends DefaultSource[]> = RemoveUndefinedProps<SourceToParamsRecord<ExtractItemFromArray<Sources>>>

export type LoadOpts<Sources extends DefaultSource[]> = {
  inject?: InjectOpts<Sources>
  params: Params<Sources>
}