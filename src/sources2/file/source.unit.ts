import {describe, it} from "node:test";
import {FakeFileSystem, type FileSystem} from "../../sources/files/file-system.js";
import {object, type ObjectSchema} from "../../schemes2/object.js";
import {integer} from "../../schemes2/integer.js";
import {expect} from "expect";
import type {Loadable} from "../source.js";
import type {BaseSchema} from "../../schemes2/base.js";
import {readFile} from "node:fs/promises";
import {inlineCatch} from "../../utils.js";
import {string} from "../../schemes2/string.js";
import {parse} from 'yaml'
import toml from 'toml'
import {kOrigin, merge} from "../../merging/merge.js";

export type ParserFn = (content: string) => unknown

export type FileOpts = {
  file: string
  required?: boolean
}

export type FileSourceOpts = {
  files: (string | FileOpts)[],
  parsers?: Map<string, ParserFn>
}

export type FileSourceContext = {
  fs?: FileSystem
}

const nativeFileSystem = {
  readFile
}

const defaultParsers = new Map<string, ParserFn>()
  .set('.json', JSON.parse)
  .set('.yml', parse)

class FileSource implements Loadable<FileSourceContext> {
  #opts: FileSourceOpts

  constructor(opts: FileSourceOpts) {
    this.#opts = opts;
  }

  async load(schema: ObjectSchema<Record<string, BaseSchema<unknown>>>, opts: FileSourceContext): Promise<Record<string, unknown>> {
    const files = this.#simplifyFileOpts(this.#opts.files)
    const configs: Record<string, unknown>[] = []
    const { fs = nativeFileSystem } = opts

    for (const file of files) {
      const [content, err] = await inlineCatch(fs.readFile(file.file, "utf-8"))

      if (err !== undefined && this.#isFileDoesNotExistError(err)) {
        return {}
      }

      if (err !== undefined) {
        throw err
      }

      const parsed = this.#parseFile(content as string, file.file)
      configs.push(parsed as Record<string, unknown>)
    }

    return configs.reduce(merge, {})
  }

  #simplifyFileOpts(files: (string | FileOpts)[]): FileOpts[] {
    return files.map(file => typeof file === "string"
      ? ({ file } satisfies FileOpts)
      : file)
  }

  #isFileDoesNotExistError(error: unknown): boolean {
    return typeof error === "object"
      && error !== null
      && "code" in error
      && error.code === "ENOENT"
  }

  #parseFile(content: string, filename: string): unknown {
    const { parsers = defaultParsers } = this.#opts
    const mParser = Array.from(parsers.entries()).find(([ extension ]) => filename.endsWith(extension))

    if (mParser === undefined) {
      const extensionList = Array.from(parsers.keys().map(key => `"${key}"`)).join(', ')
      throw new Error(`No parser found for file "${filename}", can parse ${extensionList}`)
    }

    const [ , parser ] = mParser

    return parser(content)
  }
}

function fileSource(opts: FileSourceOpts) {
  return new FileSource(opts)
}

describe('fileSource', function () {
  it('should be able to load config from a file', async function () {
    // Given
    const schema = object({
      port: integer()
    })
    const source = fileSource({files: ['file.json']})
    const fs = new FakeFileSystem()
      .addFile('file.json', `{ "port": 3000 }`)

    // When
    const result = await source.load(schema, {fs})

    // Then
    expect(result).toEqual({port: 3000})
  })

  it('should be able to load a file optionally', async function () {
    // Given
    const schema = object({ port: integer() })
    const source = fileSource({
      files: [
        {
          file: 'file.json',
          required: false
        }
      ]
    })
    const fs = new FakeFileSystem()

    // When
    const result = await source.load(schema, { fs })

    // Then
    expect(result).toEqual({})
  })

  it('should be able to load files in order', { skip: true }, async function () {
    // Given
    const schema = object({
      port: integer(),
      host: string()
    })
    const source = fileSource({
      files: [ 'config.json', 'default.json' ]
    })
    const fs = new FakeFileSystem()
      .addFile('config.json', `{ "port": 3000 }`)
      .addFile('default.json', `{ "host": "localhost" }`)

    // When
    const result = await source.load(schema, { fs })

    // Then
    expect(result).toEqual({ host: "localhost", port: 3000 })
  })

  it('should be able to parse yaml', async function () {
    // Given
    const source = fileSource({
      files: [ 'config.yml' ]
    })

    const fs = new FakeFileSystem()
      .addFile('config.yml', `port: 3000`)

    const schema = object({
      port: integer(),
    })

    // When
    const result = await source.load(schema, { fs })

    // Then
    expect(result).toEqual({ port: 3000 })
  })

  it('should be able to define custom parsers', function () {
    // Given
    // When
    // Then
  })

  it('should be able to throw given there is no parser matching the file extension', async function () {
    // Given
    const source = fileSource({ files: [ 'config.txt' ] })
    const schema = object({ port: integer() })
    const fs = new FakeFileSystem()
      .addFile('config.txt', '')

    // When
    const promise = source.load(schema, { fs })

    // Then
    await expect(promise).rejects.toThrow(new Error('No parser found for file "config.txt", can parse ".json", ".yml"'))
  })

  it('should be able to override the default parsers', async function () {
    // Given
    const source = fileSource({
      files: [ 'config.toml' ],
      parsers: new Map<string, ParserFn>()
        .set('.toml', toml.parse)
    })
    const schema = object({ port: integer() })
    const fs = new FakeFileSystem()
      .addFile('config.toml', 'port = 3000')

    // When
    const result = await source.load(schema, { fs })

    // Then
    expect(result).toEqual({ port: 3000 })
  })

  it('should be able to load multiple files', {skip: true}, async function () {
    // Given
    const source = fileSource({
      files: [ 'config.json', 'default.json' ]
    })

    const fs = new FakeFileSystem()
      .addFile('config.json', `{ "port": 3000 }`)
      .addFile('default.json', `{ "host": "localhost" }`)

    const schema = object({
      port: integer(),
      host: string()
    })

    // When
    const result = await source.load(schema, { fs })

    // Then
    expect(result).toEqual({ host: "localhost", port: 3000 })
    expect(result[kOrigin as unknown as string]).toEqual({
      host: 'default.json',
      port: 'config.json'
    })
  })
})