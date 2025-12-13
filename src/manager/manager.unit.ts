import {describe, it} from 'node:test'
import {object} from "../schemes/object.js";
import {envSource} from "../sources/env/source.js";
import {integer} from "../schemes/integer.js";
import {expect} from "expect";
import {kOrigin} from "../merging/merge.js";
import {FakeFileSystem, type FileSystem} from "../file-system/file-system.js";
import {string} from "../schemes/string.js";
import {fileSource} from "../sources/file/source.js";
import {type LoadParams as FileLoadParams} from "../sources/file/types.js";
import {expectTypeOf} from "expect-type";
import {file} from "../sources/file/schemes.js";
import {createManager} from "./manager.js";
import type {InjectOpts, LoadOpts, SourceParams} from "./types.js";
import type { Source } from '../sources/source.js';

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
      },
      params: {}
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
      },
      params: {}
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
        fileSource()
      ]
    })

    // When
    const config = await manager.load({
      inject: {
        file: {fs},
        envs: {envs}
      },
      params: {
        file: { files: ['config.json'] }
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
          fileSource(),
        ]
      })

      // When
      const config = await manager.load({
        inject: {
          file: {fs},
          envs: {envs}
        },
        params: {
          file: {
            files: ['config.json']
          }
        }
      })

      // Then
      expect(config).toEqual({port: 3111, [kOrigin]: {port: 'env:PORT'}})
    })
  })

  describe('loading refs', function () {
    it('should be able to load refs', async function () {
      // Given
      const manager = createManager({
        schema: object({
          certificate: file()
        }),
        sources: [
          envSource(),
          fileSource()
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
        },
        params: {}
      })

      // Then
      expect(config).toEqual({
        certificate: 'my certificate',
        [kOrigin]: {
          certificate: '/path/to/cert'
        }
      })
    })

    it('should be able to load a ref with mergeable content', async function () {
      // Given
      const manager = createManager({
        schema: object({
          httpServer: file({
            encoding: 'utf8',
            parseAs: object({
              port: integer()
            })
          })
        }),
        sources: [
          envSource(),
          fileSource()
        ]
      })

      const fs = new FakeFileSystem()
        .addFile('/path/to/config.json', `{ "port": 3111 }`)

      const envs = {
        HTTP_SERVER: '/path/to/config.json'
      }

      // When
      const config = await manager.load({
        inject: {
          envs: { envs },
          file: { fs }
        },
        params: {}
      })

      // Then
      expect(config).toEqual({
        httpServer: { port: 3111, [kOrigin]: { port: '/path/to/config.json'} },
        // TODO: I don't know if resolved refs should be in the origins like this.
        //       It is a bit weird.
        [kOrigin]: {
          httpServer: 'env:HTTP_SERVER'
        },
      })
    })

    it('should be able to load ref in ref', async function () {
      // Given
      const manager = createManager({
        schema: object({
          httpServer: file({
            encoding: 'utf8',
            parseAs: object({
              port: integer(),
              ssl: file('utf8')
            })
          })
        }),
        sources: [
          envSource(),
          fileSource()
        ]
      })

      const fs = new FakeFileSystem()
        .addFile('/path/to/config.json', `{ "port": 3111, "ssl": "/path/to/cert" }`)
        .addFile('/path/to/cert', 'my certificate')

      const envs = {
        HTTP_SERVER: '/path/to/config.json'
      }

      // When
      const config = await manager.load({
        inject: {
          envs: { envs },
          file: { fs }
        },
        params: {
          file: {}
        }
      })

      // Then
      expect(config).toEqual({
        httpServer: { port: 3111, ssl: 'my certificate', [kOrigin]: { port: '/path/to/config.json', ssl: '/path/to/cert'} },
        [kOrigin]: {
          httpServer: 'env:HTTP_SERVER'
        },
      })
    })
  })

  describe('default value', function () {
    it('should be able to not apply default values given the entry is defined', async function () {
      // Given
      const manager = createManager({
        schema: object({
          host: string({ defaultValue: '0.0.0.0' })
        }),
        sources: [
          envSource()
        ]
      })

      // When
      const config = await manager.load({
        inject: {
          envs: {
            envs: { HOST: '127.0.0.1' }
          }
        },
        params: {}
      })

      // Then
      expect(config).toEqual({host: '127.0.0.1', [kOrigin]: {host: 'env:HOST'}})
    })

    it('should be able to apply default values given the entry is undefined', async function () {
      // Given
      const manager = createManager({
        schema: object({
          host: string({ defaultValue: '0.0.0.0' })
        }),
        sources: [
          envSource()
        ]
      })

      // When
      const config = await manager.load({
        inject: {
          envs: {
            envs: {}
          }
        },
        params: {}
      })

      // Then
      expect(config).toEqual({host: '0.0.0.0', [kOrigin]: {host: 'default'}})
    })
  })
})

describe('InjectOpts', function () {
  it('should be able to transform a source array into a record of injection opts', function () {
    // Given
    const envs = envSource()
    const fs = fileSource()
    const sources = [envs, fs]

    // When
    type T = InjectOpts<typeof sources>

    // Then
    expectTypeOf<T>().toEqualTypeOf<{ file: { fs?: FileSystem }, envs: { envs?: NodeJS.ProcessEnv } }>()
  })
})

describe('SourceParams', function () {
  it('should be able to transform a source array into a record of params', function () {
    // Given
    const file = fileSource()
    const sources = [file]

    // When
    type T = SourceParams<typeof sources>

    // Then
    expectTypeOf<T>().toEqualTypeOf<{ file?: FileLoadParams }>()
  })

  it('should be able to remove source that have undefined as params', function () {
    // Given
    const env = envSource()
    const sources = [env]

    // When
    type T = SourceParams<typeof sources>

    // Then
    expectTypeOf<T>().toEqualTypeOf<{}>()
  })

  it('should be able to return an optional prop given all the params are optional', function () {
    // Given
    type MySource = Source<"foo", {}, {}, { msg?: string }>

    // When
    type T = SourceParams<[MySource]>

    // Then
    expectTypeOf<T>().toEqualTypeOf<{ foo?: { msg?: string } }>()
  })

  it('should be able to require the params given at least one prop is required', function () {
    // Given
    type MySource = Source<"foo", {}, {}, { msg: string }>

    // When
    type T = SourceParams<[MySource]>

    // Then
    expectTypeOf<T>().toEqualTypeOf<{ foo: { msg: string } }>()
  })
})

describe('LoadOpts', function () {
  it('should be able to make params optional given every props are optional', function () {
    // Given
    type MySource = Source<"foo", {}, {}, { msg?: string }>

    // When
    type T = LoadOpts<[MySource]>

    // Then
    expectTypeOf<T["params"]>().toEqualTypeOf<{
      foo?: { msg?: string }
    }>()
  })
})