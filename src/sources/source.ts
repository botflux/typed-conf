import type {ObjectSchema} from "../schemes/object.js";
import type {BaseSchema} from "../schemes/base.js";

export interface Loadable<InjectOpts> {
  load(schema: ObjectSchema<Record<string, BaseSchema<unknown>>, boolean>, inject: InjectOpts): Promise<Record<string, unknown>>
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
   * @param previous
   */
  loadFromParams(params: Params, schema: BaseSchema<unknown>, opts: Opts, previous: Record<string, unknown>): Promise<LoadResult>

  /**
   * Validate the given params.
   *
   * @param params
   */
  areValidParams(params: Record<string, unknown>): params is Params
}

export interface Source<Name extends string, InjectOpts, Params extends Record<string, unknown>> extends Partial<LoadableFromParams<InjectOpts, Params>>, Partial<Loadable<InjectOpts>> {
  name: Name
}
