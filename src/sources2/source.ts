import type {ObjectSchema} from "../schemes2/object.js";
import type {BaseSchema} from "../schemes2/base.js";

export interface Loadable<Opts> {
  load(schema: ObjectSchema<Record<string, BaseSchema<unknown>>>, opts: Opts): Promise<Record<string, unknown>>
}

export interface LoadableRef<Opts> {
  loadFromRef(ref: string, schema: BaseSchema<unknown>, opts: Opts): Promise<unknown>
}

export interface LoadableFromParams<Opts, Params extends Record<string, unknown>> {
  loadFromParams(params: Params, schema: ObjectSchema<Record<string, BaseSchema<unknown>>>, opts: Opts): Promise<Record<string, unknown>>
  validateParams(params: Record<string, unknown>): params is Params
}
