import type {Source, SourcesToRecord} from "../sources/source.js";
import {merge} from "merge-anything";
import {type IndirectionEvaluator} from "../indirection/evaluator.js";
import {compileIndirectionExpression} from "../indirection/compiler.js";
import {DefaultEvaluator} from "../indirection/default-evaluator.js";
import {isIndirection} from "../indirection/is-indirection.js";
import {ValibotValidator} from "../validation/valibot.js";
import {type BaseSchema, type BaseSchemaBuilder, flatten, kType} from "../schemes/base.js";
import {string} from "../schemes/string.js";
import {boolean} from "../schemes/boolean.js";
import {integer} from "../schemes/integer.js";
import {float} from "../schemes/float.js";
import {secret} from "../schemes/secret.js";
import {object, type ObjectSchema, ObjectSchemaBuilder} from "../schemes/object.js";
import type {RefSchema} from "../schemes/ref.js";
import {getValueAtPath, setValueAtPath} from "../utils.js";
import type {Clock} from "../clock/clock.interface.js";
import {NativeClock} from "../clock/native-clock.js";

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
    const { sources, clock = new NativeClock() } = opts
    let previouslyLoaded = {}
    const baseSourceDeps = { clock }

    for (const source of this.sources) {
      // @ts-expect-error
      const sourceOptions = sources[source.key]
      const completeOptions = Object.assign(sourceOptions ?? {}, baseSourceDeps)
      const loaded = await source.load(this.configSchema.schema, previouslyLoaded, completeOptions as never) as any

      previouslyLoaded = merge(previouslyLoaded, loaded)
    }

    const evaluator = new DefaultEvaluator()

    for (const source of this.sources) {
      if ('getEvaluatorFunction' in source) {
        // @ts-expect-error
        const sourceOptions = sources[source.key]
        const completeOptions = Object.assign(sourceOptions ?? {}, baseSourceDeps)
        evaluator.registerFunction(source.getEvaluatorFunction(
          previouslyLoaded,
          completeOptions as never
        ))
      }
    }

    await this.#resolveIndirection(previouslyLoaded, evaluator)
    await this.#resolveRefs(previouslyLoaded, evaluator)

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

  async #resolveRefs(previouslyLoaded: Record<string, unknown>, evaluator: IndirectionEvaluator): Promise<void> {
    const entries = flatten(this.configSchema.schema)

    for (const { key, value } of entries) {
      if (!isRef(value)) {
        continue
      }

      const mValue = getValueAtPath(previouslyLoaded, key)

      if (mValue === undefined) {
        continue
      }

      if (typeof mValue !== "string") {
        throw new Error(`Cannot resolve ref '${key}' because the value is not a string (${mValue})`)
      }

      const resolved = await evaluator.evaluate({
        source: value.sourceName,
        args: [ mValue ]
      }, previouslyLoaded)

      setValueAtPath(previouslyLoaded, key, resolved)
    }
  }
}

function isRef (schema: BaseSchema<unknown>): schema is RefSchema<unknown> {
  return "type" in schema && schema.type === "ref"
}

function config<Schema extends ObjectSchemaBuilder<Record<string, any>>, Sources extends Source<string, never>[]>(configOpts: ConfigOpts<Schema, Sources>): ConfigLoader<Schema, Sources> {
  return new DefaultConfigLoader(configOpts.schema, configOpts.sources)
}
