import type {Source, SourcesToRecord} from "./sources/source.js";
import {type BaseSchema, boolean, float, integer, kType, object, type ObjectSchema, secret, string} from "./schemes.js";
import {merge} from "merge-anything";
import {type IndirectionEvaluator, OneOfEvaluator} from "./indirection/evaluator.js";
import {isIndirection, parseIndirection} from "./indirection.js";
import {compileIndirectionExpression} from "./indirection/compiler.js";
import {DefaultEvaluator} from "./indirection/default-evaluator.js";

export const c = {
  config,
  string,
  object,
  boolean,
  integer,
  float,
  secret
}

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Static<
  T extends ConfigSpec<
    ObjectSchema<Record<string, BaseSchema<unknown>>>,
    Source<string, never>[]
  >
> = Prettify<T["configSchema"][typeof kType]>

export type Static2<T extends BaseSchema<unknown>> = T[typeof kType]

export type LoadOpts<Sources extends Source<string, never>[]> = {
  sources: SourcesToRecord<Sources>
}

export type ConfigSpec<ConfigSchema extends ObjectSchema<Record<string, BaseSchema<any>>>, Sources extends Source<string, never>[]> = {
  configSchema: ConfigSchema
  sources: Sources
  load: (opts: LoadOpts<Sources>) => Promise<Prettify<ConfigSchema[typeof kType]>>
}

export type ConfigOpts<Schema extends ObjectSchema<Record<string, any>>, Sources extends Source<string, never>[]> = {
  schema: Schema
  sources: Sources
}

function config<Schema extends ObjectSchema<Record<string, any>>, Sources extends Source<string, never>[]>(configOpts: ConfigOpts<Schema, Sources>): ConfigSpec<Schema, Sources> {
  async function resolveIndirection(obj: Record<string, unknown>, evaluator: IndirectionEvaluator): Promise<void> {
    for (const key in obj) {
      const value = obj[key]

      if (typeof value === "object" && value !== null) {
        await resolveIndirection(value as Record<string, unknown>, evaluator)
      }

      if (typeof value !== "string") {
        continue
      }

      if (!isIndirection(value)) {
        continue
      }

      const indirection = compileIndirectionExpression(value)

      if (!evaluator.supports(indirection)) {
        throw new Error(`Indirection evaluator does not support indirection: ${value}`)
      }

      obj[key] = await evaluator.evaluate(indirection, obj)
    }
  }

  return {
    configSchema: configOpts.schema,
    sources: configOpts.sources,
    load: async (opts: LoadOpts<Sources>) => {
      const { sources } = opts
      // const evaluators = configOpts.sources
      //   .filter(s => "getEvaluator" in s)
      //   .map(s => s.getEvaluator!(
      //     // @ts-expect-error
      //     sources[s.key]
      //   ))


      let previouslyLoaded = {}

      for (const source of configOpts.sources) {
        // @ts-expect-error
        const o = sources[source.key]
        const loaded = await source.load(configOpts.schema, previouslyLoaded, o) as any

        previouslyLoaded = merge(previouslyLoaded, loaded)
      }


      const evaluator = new DefaultEvaluator()

      for (const source of configOpts.sources) {
        if ('getEvaluatorFunction' in source) {
          evaluator.registerFunction(source.getEvaluatorFunction(
            previouslyLoaded,
            // @ts-expect-error
            sources[source.key]
          ))
        }
      }


      await resolveIndirection(previouslyLoaded, evaluator)

      return previouslyLoaded as Prettify<Schema[typeof kType]>
    },
  }
}

