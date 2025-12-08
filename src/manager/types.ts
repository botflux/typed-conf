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

export type HasOnlyOptionalProps<T> = {} extends T ? true : false;

export type OptionalIfAllOptional<T> = {
  [K in keyof T as HasOnlyOptionalProps<T[K]> extends true ? never : K]: T[K]
} & {
  [K in keyof T as HasOnlyOptionalProps<T[K]> extends true ? K : never]?: T[K]
};

export type SourceToParamsRecord<T extends DefaultSource> = T extends Source<infer K, any, any, infer V> ? OptionalIfAllOptional<Record<K, V>> : never
export type RemoveUndefinedProps<T> = {
  [K in keyof T as T[K] extends undefined ? never : K]: T[K]
}

export type SourceParams<Sources extends DefaultSource[]> = Prettify<MergeUnionTypes<RemoveUndefinedProps<SourceToParamsRecord<ExtractItemFromArray<Sources>>>>>

export type LoadOpts<Sources extends DefaultSource[]> = {
  inject?: InjectOpts<Sources>
  params: SourceParams<Sources>
}