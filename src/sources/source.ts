import type {EvaluatorFunction} from "../indirection/default-evaluator.js";
import type {ObjectSchema, ObjectSpec} from "../schemes/object.js";
import type {SchemaValidator} from "../validation/validator.js";
import type {JSONSchema} from "json-schema-to-typescript";
import {transform} from "valibot";
import type {Static} from "../loader.js";
import type {BaseSchema, BaseSchemaBuilder} from "../schemes/base.js";

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
   * @param deps
   *             This parameter is useful when testing because it allows injecting env variables
   *             or mocked filesystem.
   */
  load<S extends BaseSchemaBuilder<BaseSchema<unknown>>> (schema: S, loaded: Record<string, unknown>, deps?: Deps): Promise<RawConfig<Static<S>>>

  /**
   * Returns a function that will be executed during
   * indirection expression evaluation.
   */
  getEvaluatorFunction?(loaded: Record<string, unknown>, deps?: Deps): EvaluatorFunction
}

export interface RawConfig<T> {
  validate(validator: SchemaValidator): T
}

export class DefaultRawConfig<SourceRepresentation, Validated> implements RawConfig<Validated> {
  #sourceName: string
  #unvalidated: unknown
  #schema: JSONSchema

  #transform: (value: SourceRepresentation) => Validated

  constructor(sourceName: string, unvalidated: unknown, schema: JSONSchema, transform: (value: SourceRepresentation) => Validated) {
    this.#sourceName = sourceName;
    this.#unvalidated = unvalidated;
    this.#schema = schema;
    this.#transform = transform;
  }

  validate(validator: SchemaValidator): Validated {
    validator.validate(this.#schema, this.#unvalidated, this.#sourceName)
    return this.#transform(this.#unvalidated as SourceRepresentation)
  }
}

export type ExtractItemFromArray<T> = T extends Array<infer U> ? U : never

export type SourceToRecord<T extends Source<string, never>> = T extends Source<infer K, infer V>
  ? Record<K, V>
  : never

export type MergeUnionTypes<T> = (T extends any ? (x: T) => any : never) extends
  (x: infer R) => any ? R : never;

export type SourcesToRecord<T extends Source<string, never>[]> = Partial<MergeUnionTypes<SourceToRecord<ExtractItemFromArray<T>>>>