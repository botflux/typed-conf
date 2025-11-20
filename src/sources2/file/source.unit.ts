import {describe, it} from "node:test";
import {FakeFileSystem} from "../../sources/files/file-system.js";
import {object} from "../../schemes2/object.js";
import {integer} from "../../schemes2/integer.js";
import {expect} from "expect";
import {string} from "../../schemes2/string.js";
import toml from 'toml'
import {kOrigin} from "../../merging/merge.js";
import {fileSource, type ParserFn} from "./source.js";

describe('fileSource', function () {
  describe('#load', function () {
    it('should be able to load config from a file', {only: true}, async function () {
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
      expect(result).toEqual({ port: 3000, [kOrigin]: { port: 'file.json' } })
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
      expect(result).toEqual({
        port: 3000,
        [kOrigin]: { port: 'config.yml' }
      })
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
      expect(result).toEqual({
        port: 3000,
        [kOrigin]: { port: 'config.toml' }
      })
    })

    it('should be able to load multiple files', async function () {
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
      expect(result).toEqual({
        host: "localhost",
        port: 3000,
        [kOrigin]: { port: 'config.json', host: 'default.json' }
      })
    })
  })

  describe('#loadFromParams', function () {
    it('should be able to load a file from params', async function () {
      // Given
      const source = fileSource({ files: [ 'config.json' ] })
      const fs = new FakeFileSystem()
        .addFile('config.txt', 'foo bar')

      // When
      const result = await source.loadFromParams({ file: 'config.txt', encoding: 'utf8' }, object({}), {
        fs
      })

      // Then
      expect(result).toEqual({
        type: 'non_mergeable',
        origin: 'config.txt',
        value: 'foo bar'
      })
    })

    it('should be able to parse a file loaded with params', async function () {
      // Given
      const source = fileSource({ files: [ 'config.json' ] })
      const fs = new FakeFileSystem()
        .addFile('nested.json', `{ "port": 3000 }`)

      // When
      const result = await source.loadFromParams({
        file: 'nested.json',
        encoding: 'utf8',
        parse: true
      }, object({ port: integer() }), {
        fs
      })

      // Then
      expect(result).toEqual({
        type: 'mergeable',
        value: { port: 3000, [kOrigin]: { port: 'nested.json' } }
      })
    })
  })
})