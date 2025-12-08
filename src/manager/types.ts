import type {Source} from "../sources/source.js";
import type {ExtractItemFromArray, MergeUnionTypes, Prettify} from "../types.js";
import type {ObjectSchema} from "../schemes/object.js";
import type {BaseSchema} from "../schemes/base.js";

export type DefaultObjectSchema = ObjectSchema<Record<string, BaseSchema<unknown>>, boolean>
export type DefaultSource = Source<string, unknown, Record<string, unknown>>
export type ManagerOpts<
  Schema extends DefaultObjectSchema,
  Sources extends DefaultSource[]
> = {
  schema: Schema
  sources: Sources
}
export type SourceToRecord<T extends DefaultSource> = T extends Source<infer K, infer V, any> ? Record<K, V> : never
export type InjectOpts<Sources extends DefaultSource[]> = Prettify<MergeUnionTypes<SourceToRecord<ExtractItemFromArray<Sources>>>>
export type LoadOpts<Sources extends DefaultSource[]> = {
  inject?: InjectOpts<Sources>
}