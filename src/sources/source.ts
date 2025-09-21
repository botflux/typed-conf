import type {ObjectSchema, ObjectSpec} from "../schemes.js";
import type {IndirectionEvaluator} from "../indirection/evaluator.js";
import type {EvaluatorFunction} from "../indirection/default-evaluator.js";

export type LoadedValue<T> = {
  value: T
  source: string
  nameInSource: string
}

export type LoadedValues = {
  [key: string]: Values
}

export type Values = LoadedValue<unknown> | LoadedValues
export type LoadedConfig = Record<string, Values>

export interface Source<K extends string, Deps> {
  /**
   * The string identifier of the source.
   *
   */
  key: K

  /**
   * Load the configuration from the source.
   * The output configuration should be an object even if the underlying source
   * represents the configuration as a dictionary.
   *
   * @param schema The configuration schema
   * @param loaded The configuration that was already loaded.
   * @param opts The source load-time dependencies.
   *             This parameter is useful when testing because it allows injecting env variables
   *             or mocked filesystem.
   */
  load: (schema: ObjectSchema<ObjectSpec>, loaded: Record<string, unknown>, deps?: Deps) => Promise<Record<string, unknown>>

  load2: (schema: ObjectSchema<ObjectSpec>, loaded: Record<string, LoadedValue<unknown>>, deps?: Deps) => Promise<LoadedConfig>

  /**
   * Returns a function that will be executed during
   * indirection expression evaluation.
   */
  getEvaluatorFunction?(loaded: Record<string, unknown>, deps?: Deps): EvaluatorFunction
}

export type ExtractItemFromArray<T> = T extends Array<infer U> ? U : never

export type SourceToRecord<T extends Source<string, never>> = T extends Source<infer K, infer V>
  ? Record<K, V>
  : never

export type MergeUnionTypes<T> = (T extends any ? (x: T) => any : never) extends
  (x: infer R) => any ? R : never;

export type SourcesToRecord<T extends Source<string, never>[]> = Partial<MergeUnionTypes<SourceToRecord<ExtractItemFromArray<T>>>>