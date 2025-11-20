import type {ObjectSchema} from "../schemes2/object.js";
import type {BaseSchema} from "../schemes2/base.js";

export interface Loadable<Opts> {
  load(schema: ObjectSchema<Record<string, BaseSchema<unknown>>>, opts: Opts): Promise<Record<string, unknown>>
}

export interface LoadableRef<Opts> {
  loadFromRef(ref: string, schema: BaseSchema<unknown>, opts: Opts): Promise<unknown>
}

export type NonMergeableResult = {
  type: 'non_mergeable'
  origin: string
  value: unknown
}

export type MergeableResult = {
  type: 'mergeable'
  value: Record<string, unknown>
}

export type LoadResult = NonMergeableResult | MergeableResult

export interface LoadableFromParams<Opts, Params extends Record<string, unknown>> {
  /**
   * Load a configuration from a source using params.
   * This method is meant to be used to load refs.
   *
   * @param params
   * @param schema
   * @param opts
   */
  loadFromParams(params: Params, schema: BaseSchema<unknown>, opts: Opts): Promise<LoadResult>

  /**
   * Validate the given params.
   *
   * @param params
   */
  areValidParams(params: Record<string, unknown>): params is Params
}
