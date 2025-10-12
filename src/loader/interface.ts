import type {Source, SourcesToRecord} from "../sources/source.js";
import type {Clock} from "../clock/clock.interface.js";
import {ObjectSchemaBuilder} from "../schemes/object.js";
import {type BaseSchemaBuilder, kType} from "../schemes/base.js";

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
export type LoadOpts<Sources extends Source<string, never>[]> = {
  sources: SourcesToRecord<Sources>

  /**
   * A clock implementation.
   * This option is meant to be used in tests to mock the time.
   */
  clock?: Clock
}

export interface ConfigLoader<ConfigSchema extends ObjectSchemaBuilder<Record<string, BaseSchemaBuilder<any>>>, Sources extends Source<string, never>[]> {
  configSchema: ConfigSchema
  sources: Sources

  load(opts: LoadOpts<Sources>): Promise<Prettify<ConfigSchema["schema"][typeof kType]>>
}