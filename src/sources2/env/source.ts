import {isObject, type ObjectSchema} from "../../schemes2/object.js";
import type {BaseSchema} from "../../schemes2/base.js";
import {setValueAtPath} from "../../utils.js";
import type {Loadable, LoadableRef} from "../source.js";
import {setOrigin} from "../../merging/origin-utils.js";
import {kOrigin} from "../../merging/merge.js";

export type EnvSourceLoadOpts = {
  envs?: NodeJS.ProcessEnv
}

class Source implements Loadable<EnvSourceLoadOpts>, LoadableRef<EnvSourceLoadOpts> {
  #opts: EnvSourceOpts

  constructor(opts: EnvSourceOpts) {
    this.#opts = opts;
  }

  async load(schema: ObjectSchema<Record<string, BaseSchema<unknown>>>, opts: EnvSourceLoadOpts) {
    const {envs = process.env} = opts
    const result: Record<string, unknown> = {}
    const flattened = this.#flattenObjectSchema(schema)

    const seenEnvNames = new Map<string, string>()

    for (const [key, value] of flattened) {
      const envName = this.#addPrefixIfDefined(camelCasePathToScreamingSnakeCase(key))
      const mSeenEnvName = seenEnvNames.get(envName)
      const envValue = envs[envName]

      if (mSeenEnvName !== undefined) {
        throw new Error(`The props ${mSeenEnvName} and ${key.join('.')} resolves to the same env ${envName}`)
      }

      seenEnvNames.set(envName, key.join('.'))

      const coerced = value.coerce?.(envValue) ?? envValue

      if (envs[envName] !== undefined) {
        setValueAtPath(result, key, coerced)
        setValueAtPath(result, this.#getOriginPath(key), `env:${envName}`)
      }
    }

    return result
  }

  async loadFromRef(ref: string, schema: BaseSchema<unknown>, opts: EnvSourceLoadOpts): Promise<unknown> {
    const {envs = process.env} = opts
    const envValue = envs[ref]

    if (envValue === undefined) {
      return envValue
    }

    return schema.coerce?.(envValue) ?? envValue
  }

  #flattenObjectSchema(schema: BaseSchema<unknown>, prefix: string[] = []): [path: string[], schema: BaseSchema<unknown>][] {
    if (!isObject(schema)) {
      return [[prefix, schema] as const]
    }

    return Object.entries(schema.props).flatMap(([key, schema]) => this.#flattenObjectSchema(
      schema,
      [...prefix, key]
    ))
  }

  #addPrefixIfDefined(key: string): string {
    if (this.#opts.prefix === undefined) {
      return key
    }

    return `${this.#opts.prefix}_${key}`
  }

  #getOriginPath(key: string[]): (string | symbol)[] {
    const lastKey = key[key.length - 1]

    if (lastKey === undefined) {
      throw new Error('Path should not be empty')
    }

    return [...key.slice(0, -1), kOrigin, lastKey]
  }
}

export type EnvSourceOpts = {
  prefix?: string
}

export function envSource(opts: EnvSourceOpts = {}) {
  return new Source(opts)
}

function camelCasePathToScreamingSnakeCase(path: string[]) {
  return path.map(camelCaseToScreamingSnakeCase).join('_')
}

export function camelCaseToScreamingSnakeCase(name: string) {
  return name.split('').reduce(
    (acc, current, index) => {
      const next = name.at(index + 1)

      if (next === undefined) {
        return acc + current
      }

      const isCurrentLowercase = current.toLowerCase() === current
      const isNextUppercase = next.toUpperCase() === next

      if (isCurrentLowercase && isNextUppercase) {
        return acc + current + '_'
      }

      return acc + current
    }, '').toUpperCase()
}