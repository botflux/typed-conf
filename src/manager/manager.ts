import type {Loadable, SingleValueLoader, LoadResult} from "../sources/source.js";
import {type BaseSchema, kType} from "../schemes/base.js";
import type {Prettify} from "../types.js";
import {kOrigin, merge} from "../merging/merge.js";
import {getOrigin, setOrigin} from "../merging/origin-utils.js";
import {walk} from "../schemes/walk.js";
import {isRef} from "../schemes/ref.js";
import {getValueAtPath, setValueAtPath} from "../utils.js";
import type {DefaultObjectSchema, DefaultSource, LoadOpts, ManagerOpts} from "./types.js";
import { Compile, Validator } from 'typebox/compile'

class Manager<Schema extends DefaultObjectSchema, Sources extends DefaultSource[]> {
  #opts: ManagerOpts<Schema, Sources>
  #typeboxValidator: Validator | undefined

  constructor(opts: ManagerOpts<Schema, Sources>) {
    this.#opts = opts;
  }

  async load(opts: LoadOpts<Sources>): Promise<Prettify<Schema[typeof kType]>> {
    const {inject, params} = opts
    const {schema, sources} = this.#opts

    let previous: Record<string, unknown> = {}

    for (const source of sources) {
      // @ts-expect-error
      const sourceInject = inject?.[source.name] as unknown
      // @ts-expect-error
      const sourceParams = params?.[source.name] as unknown

      if (!this.#isLoadable(source)) continue

      const value = await source.load(sourceParams, schema, sourceInject)
      merge(previous, value)
    }

    if (this.#opts.schema.defaultValue !== undefined) {
      merge(previous, setOrigin(this.#opts.schema.defaultValue, 'default'))
    }

    const errors = this.#typebox.Errors(previous)

    if (errors.length > 0) {
      throw new AggregateError(errors.map(err => new Error(`${this.#getOrigin(previous, err.instancePath)} ${err.message}`)), 'config validation failed')
    }

    await this.#resolveRefs(schema, previous, inject)

    return previous as Prettify<Schema[typeof kType]>
  }

  #getOrigin(previous: Record<string, unknown>, instancePath: string): string {
    const chunks = instancePath.split('/')
      .filter(chunk => chunk !== '')

    const propName = chunks.at(-1)

    if (propName === undefined) {
      throw new Error("Not implemented at line 66 in manager.ts")
    }

    const parentPath = chunks.slice(0, chunks.length - 1)
    const parent = getValueAtPath(previous, parentPath)

    if (typeof parent !== 'object' || parent === null) {
      throw new Error("Not implemented at line 67 in manager.ts")
    }

    const mOrigin = getOrigin(parent as Record<string, unknown>)[propName]

    if (mOrigin === undefined) {
      throw new Error(`Cannot find origin for path '${instancePath}'`)
    }

    return mOrigin
  }

  #isLoadable(source: DefaultSource): source is (DefaultSource & Loadable<unknown, unknown>) {
    return 'load' in source
  }

  #canLoadSingleValue(source: DefaultSource): source is (DefaultSource & SingleValueLoader<unknown, Record<string, unknown>>) {
    return 'loadSingle' in source
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

      if (!this.#canLoadSingleValue(source)) {
        throw new Error(`Cannot resolve ref at path '${(path as string[]).join('.')}': source '${childSchema.sourceName}' does not support loadFromParams`)
      }

      // @ts-expect-error
      const sourceInject = inject?.[source.name] as unknown

      const result: LoadResult = await source.loadSingle(params, childSchema.refSchema, sourceInject, previous)

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

  get #typebox(): Validator {
    if (!this.#typeboxValidator) {
      this.#typeboxValidator = Compile(this.#opts.schema.validationSchema!)
    }
    return this.#typeboxValidator
  }
}

export function createManager<Schema extends DefaultObjectSchema, Sources extends DefaultSource[]>(opts: ManagerOpts<Schema, Sources>) {
  return new Manager(opts)
}