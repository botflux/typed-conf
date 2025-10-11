import {describe, it} from "node:test";
import {FakeFileSystem, fileSource} from "./sources/files.js";
import {c} from "./loader.js";
import {expect} from "expect";
import {FileParsingError} from "./sources/file-parsing.error.js";

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
})