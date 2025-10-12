import {describe, it} from "node:test";
import {fileSource} from "./files.js";
import {c} from "../../loader/loader.js";
import {expect} from "expect";
import {FileParsingError} from "./file-parsing.error.js";
import {ValidationError} from "../../validation/validation.error.js";
import {FakeFileSystem} from "./file-system.js";

describe('fileSource', function () {
  it('should be able to load configuration from a file source', async function () {
    // Given
    const source = fileSource({
      file: 'file.json'
    })

    const schema = c.object({
      foo: c.string()
    })

    const fileSystem = new FakeFileSystem()
      .addFile('file.json', `{ "foo": "bar" }`)

    // When
    const result = await source.load(schema.schema, {}, {
      fs: fileSystem
    })

    // Then
    expect(result).toEqual({foo: "bar"})
  })

  it('should be able to throw given the config cannot be parsed', async function () {
    // Given
    const source = fileSource({
      file: 'file.json'
    })

    const schema = c.object({})

    const fileSystem = new FakeFileSystem()
      .addFile('file.json', `{ "foo"`)

    // When
    const promise = source.load(schema.schema, {}, {
      fs: fileSystem
    })

    // Then
    await expect(promise).rejects.toThrow(new FileParsingError('file.json', 'JSON', {
      cause: new Error(`Expected ':' after property name in JSON at position 7 (line 1 column 8)`)
    }))
  })

  describe('validation', function () {
    it('should be able to throw given the loaded config is not an object', async function () {
      // Given
      const source = fileSource({
        file: 'file.json'
      })

      const fileSystem = new FakeFileSystem()
        .addFile('file.json', `"foo"`)

      const schema = c.object({
        bar: c.string()
      })

      // When
      const p = source.load(schema.schema, {}, {
        fs: fileSystem
      })

      // Then
      await expect(p).rejects.toThrow(new ValidationError("file file.json must be object, got 'foo'"))
    })

    it('should be able to throw given the loaded config does not match the schema', async function () {
      // Given
      const source = fileSource({
        file: 'file.json'
      })

      const fs = new FakeFileSystem()
        .addFile('file.json', `{ "port": "foo" }`)

      const schema = c.object({
        port: c.integer()
      })

      // When
      const p = source.load(schema.schema, {}, { fs })

      // Then
      await expect(p).rejects.toThrow(new ValidationError("port (file file.json) must be integer, got 'foo'"))
    })
  })


})