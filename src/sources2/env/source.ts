import {isObject, type ObjectSchema} from "../../schemes2/object.js";
import type {BaseSchema} from "../../schemes2/base.js";
import {setValueAtPath} from "../../utils.js";
import type {LoadResult, Source} from "../source.js";
import {kOrigin} from "../../merging/merge.js";
import type {EnvSourceOpts, InjectOpts, Params} from "./types.js";

class EnvSource<Name extends string> implements Source<Name, InjectOpts, Params> { // Loadable<EnvSourceLoadOpts>, LoadableFromParams<EnvSourceLoadOpts, Params>
  name: Name
  #opts: EnvSourceOpts<Name>

  constructor(name: Name, opts: EnvSourceOpts<Name>) {
    this.#opts = opts;
    this.name = name;
  }

  async loadFromParams(params: Params, schema: BaseSchema<unknown>, opts: InjectOpts): Promise<LoadResult> {
    const {envs = process.env} = opts
    const { key } = params
    const envValue = envs[key]

    if (envValue === undefined) {
      return {
        type: 'non_mergeable',
        origin: `env:${key}`,
        value: envValue
      }
    }

    const coerced = schema.coerce?.(envValue) ?? envValue

    return {
      type: 'non_mergeable',
      origin: `env:${key}`,
      value: coerced
    }
  }

  areValidParams(params: Record<string, unknown>): params is Params {
    throw new Error("Method not implemented.");
  }

  async load(schema: ObjectSchema<Record<string, BaseSchema<unknown>>, boolean>, opts: InjectOpts) {
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

export function envSource<Name extends string = "envs">(opts: EnvSourceOpts<Name> = {}): Source<Name, InjectOpts, Params> {
  return new EnvSource(opts.name ?? "envs" as Name, opts)
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