import type {Source, SourcesToRecord} from "./sources/source.js";
import {merge} from "merge-anything";
import {type IndirectionEvaluator} from "./indirection/evaluator.js";
import {compileIndirectionExpression} from "./indirection/compiler.js";
import {DefaultEvaluator} from "./indirection/default-evaluator.js";
import {isIndirection} from "./indirection/is-indirection.js";
import {ValibotValidator} from "./validation/valibot.js";
import {type BaseSchema, type BaseSchemaBuilder, kType} from "./schemes/base.js";
import {string} from "./schemes/string.js";
import {boolean} from "./schemes/boolean.js";
import {integer} from "./schemes/integer.js";
import {float} from "./schemes/float.js";
import {secret} from "./schemes/secret.js";
import {object, type ObjectSchema, ObjectSchemaBuilder} from "./schemes/object.js";

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

export type Static<T extends BaseSchemaBuilder<BaseSchema<unknown>>> = T["schema"][typeof kType]

export type LoadOpts<Sources extends Source<string, never>[]> = {
  sources: SourcesToRecord<Sources>
}

export type ConfigLoader<ConfigSchema extends ObjectSchemaBuilder<Record<string, BaseSchemaBuilder<any>>>, Sources extends Source<string, never>[]> = {
  configSchema: ConfigSchema
  sources: Sources
  load: (opts: LoadOpts<Sources>) => Promise<Prettify<ConfigSchema["schema"][typeof kType]>>
}

export type ConfigOpts<Schema extends ObjectSchemaBuilder<Record<string, any>>, Sources extends Source<string, never>[]> = {
  schema: Schema
  sources: Sources
}

class DefaultConfigLoader<Schema extends ObjectSchemaBuilder<Record<string, any>>, Sources extends Source<string, never>[]>
  implements ConfigLoader<Schema, Sources> {
  configSchema: Schema
  sources: Sources

  #validator = new ValibotValidator()

  constructor(configSchema: Schema, sources: Sources) {
    this.configSchema = configSchema;
    this.sources = sources;
  }

  async load(opts: LoadOpts<Sources>): Promise<Prettify<Schema["schema"][typeof kType]>> {
    const { sources } = opts
    let previouslyLoaded = {}

    for (const source of this.sources) {
      // @ts-expect-error
      const o = sources[source.key]
      const loaded = await source.load(this.configSchema.schema, previouslyLoaded, o) as any

      previouslyLoaded = merge(previouslyLoaded, loaded)
    }

    const evaluator = new DefaultEvaluator()

    for (const source of this.sources) {
      if ('getEvaluatorFunction' in source) {
        evaluator.registerFunction(source.getEvaluatorFunction(
          previouslyLoaded,
          // @ts-expect-error
          sources[source.key]
        ))
      }
    }

    await this.#resolveIndirection(previouslyLoaded, evaluator)

    return this.#validator.validate(this.configSchema.schema, previouslyLoaded) as Prettify<Schema["schema"][typeof kType]>
  }

  async #resolveIndirection(obj: Record<string, unknown>, evaluator: IndirectionEvaluator): Promise<void> {
    for (const key in obj) {
      const value = obj[key]

      if (typeof value === "object" && value !== null) {
        await this.#resolveIndirection(value as Record<string, unknown>, evaluator)
      }

      if (typeof value !== "string") {
        continue
      }

      if (!isIndirection(value)) {
        continue
      }

      const indirection = compileIndirectionExpression(value)

      obj[key] = await evaluator.evaluate(indirection, obj)
    }
  }
}

function config<Schema extends ObjectSchemaBuilder<Record<string, any>>, Sources extends Source<string, never>[]>(configOpts: ConfigOpts<Schema, Sources>): ConfigLoader<Schema, Sources> {
  return new DefaultConfigLoader(configOpts.schema, configOpts.sources)
}
