import type {EvaluatorFunction} from "../indirection/default-evaluator.js";
import type {ObjectSchema, ObjectSpec} from "../schemes/object.js";
import type {Clock} from "../clock/clock.interface.js";
import type {Ajv} from "ajv";

export type BaseDeps = {
  /**
   * Pass a clock implementation.
   * This option is useful while testing to pass a fake clock.
   */
  clock?: Clock
  ajv?: Ajv
}

export interface Source<K extends string, Deps extends BaseDeps> {
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
  load: (schema: ObjectSchema<ObjectSpec>, loaded: Record<string, unknown>, deps: Deps) => Promise<Record<string, unknown>>

  /**
   * Returns a function that will be executed during
   * indirection expression evaluation.
   */
  getEvaluatorFunction?(loaded: Record<string, unknown>, deps: Deps): EvaluatorFunction
}

export type ExtractItemFromArray<T> = T extends Array<infer U> ? U : never

export type SourceToRecord<T extends Source<string, never>> = T extends Source<infer K, infer V>
  ? Record<K, Omit<V, keyof BaseDeps>>
  : never

export type MergeUnionTypes<T> = (T extends any ? (x: T) => any : never) extends
  (x: infer R) => any ? R : never;

export type SourcesToRecord<T extends Source<string, never>[]> = Partial<MergeUnionTypes<SourceToRecord<ExtractItemFromArray<T>>>>