import type {Loadable, LoadableFromParams, LoadResult, Source} from "../sources/source.js";
import {string} from "../schemes/string.js";
import type {ObjectSchema} from "../schemes/object.js";
import {type BaseSchema, kType} from "../schemes/base.js";
import type {ExtractItemFromArray, MergeUnionTypes, Prettify} from "../types.js";
import {AjvValidator, getPreRefJsonSchema} from "../validation/validator.js";
import {kOrigin, merge} from "../merging/merge.js";
import {setOrigin} from "../merging/origin-utils.js";
import {walk} from "../schemes/walk.js";
import {isRef} from "../schemes/ref.js";
import {getValueAtPath, setValueAtPath} from "../utils.js";

export type DefaultObjectSchema = ObjectSchema<Record<string, BaseSchema<unknown>>, boolean>
export type DefaultSource = Source<string, unknown, Record<string, unknown>>
export type ManagerOpts<
  Schema extends DefaultObjectSchema,
  Sources extends DefaultSource[]
> = {
  schema: Schema
  sources: Sources
}
export type SourceToRecord<T extends DefaultSource> = T extends Source<infer K, infer V, any> ? Record<K, V> : never
export type InjectOpts<Sources extends DefaultSource[]> = Prettify<MergeUnionTypes<SourceToRecord<ExtractItemFromArray<Sources>>>>
export type LoadOpts<Sources extends DefaultSource[]> = {
  inject?: InjectOpts<Sources>
}

class Manager<Schema extends DefaultObjectSchema, Sources extends DefaultSource[]> {
  #opts: ManagerOpts<Schema, Sources>
  #validator = new AjvValidator()

  constructor(opts: ManagerOpts<Schema, Sources>) {
    this.#opts = opts;
  }

  async load(opts: LoadOpts<Sources>): Promise<Prettify<Schema[typeof kType]>> {
    const {inject} = opts
    const {schema, sources} = this.#opts

    let previous: Record<string, unknown> = {}

    for (const source of sources) {
      // @ts-expect-error
      const sourceInject = inject?.[source.name] as unknown

      if (!this.#isLoadable(source)) continue

      const value = await source.load(schema, sourceInject)
      merge(previous, value)
    }

    if (this.#opts.schema.defaultValue !== undefined) {
      merge(previous, setOrigin(this.#opts.schema.defaultValue, 'default'))
    }

    this.#validator.validate(schema, getPreRefJsonSchema, previous)

    await this.#resolveRefs(schema, previous, inject)

    return previous as Prettify<Schema[typeof kType]>
  }

  #isLoadable(source: DefaultSource): source is (DefaultSource & Loadable<unknown>) {
    return 'load' in source
  }

  #isLoadableFromParams(source: DefaultSource): source is (DefaultSource & LoadableFromParams<unknown, Record<string, unknown>>) {
    return 'loadFromParams' in source
  }

  #findSourceByName(name: string): DefaultSource | undefined {
    return this.#opts.sources.find(source => source.name === name)
  }

  async #resolveRefs(schema: BaseSchema<unknown>, previous: Record<string, unknown>, inject: LoadOpts<Sources>['inject']): Promise<void> {
    for (const [path, childSchema] of walk(schema)) {
      if (!isRef(childSchema)) continue

      const value = getValueAtPath(previous, path as string[])

      if (value === undefined) continue

      if (typeof value !== 'string') {
        throw new Error(`Cannot resolve ref at path '${(path as string[]).join('.')}' because the value is not a string`)
      }

      const params = childSchema.refToSourceParams(value)
      const source = this.#findSourceByName(childSchema.sourceName)

      if (source === undefined) {
        throw new Error(`Cannot resolve ref at path '${(path as string[]).join('.')}': source '${childSchema.sourceName}' not found`)
      }

      if (!this.#isLoadableFromParams(source)) {
        throw new Error(`Cannot resolve ref at path '${(path as string[]).join('.')}': source '${childSchema.sourceName}' does not support loadFromParams`)
      }

      // @ts-expect-error
      const sourceInject = inject?.[source.name] as unknown

      const result: LoadResult = await source.loadFromParams(params, childSchema.refSchema, sourceInject, previous)

      setValueAtPath(previous, path as string[], result.value)

      if (result.type === 'non_mergeable') {
        this.#setOriginAtPath(previous, path as string[], result.origin)
      } else {
        await this.#resolveRefs(childSchema.refSchema, result.value, inject)
      }
    }
  }

  #setOriginAtPath(obj: Record<string, unknown>, path: (string | symbol)[], origin: string): void {
    if (path.length === 0) return

    let current: any = obj
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i]!
      if (current[key] === undefined) {
        current[key] = {}
      }
      current = current[key]
    }

    if (!current[kOrigin]) {
      current[kOrigin] = {}
    }

    const lastKey = path[path.length - 1]!
    current[kOrigin][lastKey] = origin
  }
}

export function createManager<Schema extends DefaultObjectSchema, Sources extends DefaultSource[]>(opts: ManagerOpts<Schema, Sources>) {
  return new Manager(opts)
}