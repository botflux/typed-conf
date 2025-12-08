import type {LoadResult, MergeableResult, Source} from "../source.js";
import type {ObjectSchema} from "../../schemes/object.js";
import type {BaseSchema} from "../../schemes/base.js";
import {inlineCatch} from "../../utils.js";
import {setOrigin} from "../../merging/origin-utils.js";
import {merge} from "../../merging/merge.js";
import {parse} from "yaml";
import {readFile} from "node:fs/promises";
import type {FileOpts, FileSourceOpts, InjectOpts, SingleValueParams, ParserFn, LoadParams} from "./types.js";

const nativeFileSystem = {
  readFile
}

const defaultParsers = new Map<string, ParserFn>()
  .set('.json', JSON.parse)
  .set('.yml', parse)

class FileSource<Name extends string> implements Source<Name, InjectOpts, SingleValueParams, LoadParams> {
  #opts: FileSourceOpts<Name>
  name: Name

  constructor(name: Name, opts: FileSourceOpts<Name>) {
    this.#opts = opts;
    this.name = name;
  }

  async load(params: LoadParams, schema: ObjectSchema<Record<string, BaseSchema<unknown>>, boolean>, opts: InjectOpts): Promise<Record<string, unknown>> {
    const files = this.#simplifyFileOpts(params?.files ?? [])
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

  async loadSingle(params: SingleValueParams, schema: BaseSchema<unknown>, opts: InjectOpts): Promise<LoadResult> {
    const { fs = nativeFileSystem } = opts
    const { file, parse, encoding } = params

    const content = await fs.readFile(file, {
      encoding
    })

    if (parse) {
      const parsed = this.#parseFile(content.toString(), file) as Record<string, unknown>
      setOrigin(parsed, file)

      return {
        type: 'mergeable',
        value: parsed
      } satisfies MergeableResult
    }

    return {
      type: 'non_mergeable',
      value: content,
      origin: file,
    }
  }

  areValidParams(params: Record<string, unknown>): params is SingleValueParams {
    throw new Error("Not implemented at line 69 in source.ts")
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

export function fileSource<Name extends string = "file">(opts?: FileSourceOpts<Name>): Source<Name, InjectOpts, SingleValueParams, LoadParams> {
  return new FileSource(opts?.name ?? "file" as Name, { name: 'file' as Name, ...opts })
}