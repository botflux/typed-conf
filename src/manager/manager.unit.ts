import {describe, it} from 'node:test'
import {object, type ObjectSchema} from "../schemes2/object.js";
import {envSource} from "../sources2/env/source.js";
import {integer} from "../schemes2/integer.js";
import {expect} from "expect";
import {type BaseSchema, kType} from "../schemes2/base.js";
import type {Loadable, Source} from "../sources2/source.js";
import type {Prettify} from "../loader/interface.js";
import type {ExtractItemFromArray, MergeUnionTypes} from "../sources/source.js";
import {kOrigin, merge} from "../merging/merge.js";
import {AjvValidator, getPreRefJsonSchema} from "../validation2/validator.js";
import {FakeFileSystem, type FileSystem} from "../sources/files/file-system.js";
import {string} from "../schemes2/string.js";
import {fileSource} from "../sources2/file/source.js";
import {expectTypeOf} from "expect-type";
import {file} from "../sources2/file/schemes.js";
import {walk} from "../schemes2/walk.js";
import {isRef} from "../schemes2/ref.js";

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

    this.#validator.validate(schema, getPreRefJsonSchema, previous)

    return previous as Prettify<Schema[typeof kType]>
  }

  #isLoadable(source: DefaultSource): source is (DefaultSource & Loadable<unknown>) {
    return 'load' in source
  }
}

function createManager<Schema extends DefaultObjectSchema, Sources extends DefaultSource[]>(opts: ManagerOpts<Schema, Sources>) {
  return new Manager(opts)
}

describe('manager', function () {
  it('should be able to load config', async function () {
    // Given
    const envs = {PORT: '3111'}

    const schema = object({
      port: integer()
    })

    const manager = createManager({
      schema,
      sources: [envSource()]
    })

    // When
    const result = await manager.load({
      inject: {
        envs: {
          envs
        }
      }
    })

    // Then
    expect(result).toEqual({
      port: 3111,
      [kOrigin]: {
        port: 'env:PORT'
      }
    })
  })

  it('should be able to validate the loaded config', async function () {
    // Given
    const envs = {PORT: 'foo'}

    const schema = object({
      port: integer()
    })

    const manager = createManager({
      schema,
      sources: [envSource()]
    })

    // When
    const result = await manager.load({
      inject: {
        envs: {
          envs
        }
      }
    }).catch(e => e)

    // Then
    expect(result?.message).toEqual('config validation failed')
    expect(result?.errors).toEqual([
      new Error('env:PORT must be integer')
    ])
  })

  it('should be able to load config from multiple sources', async function () {
    // Given
    const envs = {PORT: '3111'}
    const fs = new FakeFileSystem()
      .addFile('config.json', `{ "host": "localhost" }`)

    const schema = object({
      port: integer(),
      host: string()
    })

    const manager = createManager({
      schema,
      sources: [
        envSource(),
        fileSource({files: ['config.json']})
      ]
    })

    // When
    const config = await manager.load({
      inject: {
        file: {fs},
        envs: {envs}
      }
    })

    // Then
    expect(config).toEqual({
      port: 3111,
      host: 'localhost',
      [kOrigin]: {
        port: 'env:PORT',
        host: 'config.json'
      }
    })
  })

  describe('loading order', function () {
    it('should be able to load the first source first', async function () {
      // Given
      const envs = {PORT: '3111'}
      const fs = new FakeFileSystem()
        .addFile('config.json', `{ "port": 5444 }`)

      const schema = object({
        port: integer(),
      })

      const manager = createManager({
        schema,
        sources: [
          envSource(),
          fileSource({files: ['config.json']}),
        ]
      })

      // When
      const config = await manager.load({
        inject: {
          file: {fs},
          envs: {envs}
        }
      })

      // Then
      expect(config).toEqual({port: 3111, [kOrigin]: {port: 'env:PORT'}})
    })
  })

  describe('loading refs', {skip: true}, function () {
    it('should be able to load refs', async function () {
      // Given
      const manager = createManager({
        schema: object({
          certificate: file()
        }),
        sources: [
          envSource(),
          fileSource({ files: [] })
        ]
      })

      const fs = new FakeFileSystem()
        .addFile('/path/to/cert', 'my certificate')

      // When
      const config = await manager.load({
        inject: {
          envs: {
            envs: { CERTIFICATE: '/path/to/cert' }
          },
          file: { fs }
        }
      })

      // Then
      expect(config).toEqual({
        certificate: 'my certificate',
        [kOrigin]: {
          certificate: 'file:/path/to/cert'
        }
      })
    })
  })
})

describe('InjectOpts', function () {
  it('should be able to transform a source array into a record of injection opts', function () {
    // Given
    const envs = envSource()
    const fs = fileSource({files: ['config.json']})
    const sources = [envs, fs]

    // When
    type T = InjectOpts<typeof sources>

    // Then
    expectTypeOf<T>().toEqualTypeOf<{ file: { fs?: FileSystem }, envs: { envs?: NodeJS.ProcessEnv } }>()
  })
})