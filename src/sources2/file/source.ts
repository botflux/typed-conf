import {string} from "../../schemes2/string.js";
import type {Loadable} from "../source.js";
import type {ObjectSchema} from "../../schemes2/object.js";
import type {BaseSchema} from "../../schemes2/base.js";
import {inlineCatch} from "../../utils.js";
import {setOrigin} from "../../merging/origin-utils.js";
import {merge} from "../../merging/merge.js";
import {parse} from "yaml";
import type {FileSystem} from "../../sources/files/file-system.js";
import {readFile} from "node:fs/promises";

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
    const {fs = nativeFileSystem} = opts

    for (const file of files) {
      const [content, err] = await inlineCatch(fs.readFile(file.file, "utf-8"))

      if (err !== undefined && this.#isFileDoesNotExistError(err)) {
        return {}
      }

      if (err !== undefined) {
        throw err
      }

      const parsed = this.#parseFile(content as string, file.file) as Record<string, unknown>
      setOrigin(parsed, file.file)
      configs.push(parsed as Record<string, unknown>)
    }

    return configs.reduce(merge, {})
  }

  #simplifyFileOpts(files: (string | FileOpts)[]): FileOpts[] {
    return files.map(file => typeof file === "string"
      ? ({file} satisfies FileOpts)
      : file)
  }

  #isFileDoesNotExistError(error: unknown): boolean {
    return typeof error === "object"
      && error !== null
      && "code" in error
      && error.code === "ENOENT"
  }

  #parseFile(content: string, filename: string): unknown {
    const {parsers = defaultParsers} = this.#opts
    const mParser = Array.from(parsers.entries()).find(([extension]) => filename.endsWith(extension))

    if (mParser === undefined) {
      const extensionList = Array.from(parsers.keys().map(key => `"${key}"`)).join(', ')
      throw new Error(`No parser found for file "${filename}", can parse ${extensionList}`)
    }

    const [, parser] = mParser

    return parser(content)
  }
}

export function fileSource(opts: FileSourceOpts) {
  return new FileSource(opts)
}