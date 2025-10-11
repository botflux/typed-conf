import type {BaseDeps, Source} from "../source.js";
import type {ObjectSchema, ObjectSpec} from "../../schemes/object.js";
import {AjvSchemaValidator} from "../../validation/ajv.js";
import {inlineCatchSync} from "../../utils.js";
import {FileParsingError} from "./file-parsing.error.js";
import {type FileSystem, regularFs} from "./file-system.js";

export type FileSourceOpts = {
  file: string
}

export type FileSourceDeps = BaseDeps & {
  fs?: FileSystem
}

class FileSource implements Source<"file", FileSourceDeps> {
  key: "file" = "file"

  #opts: FileSourceOpts

  #validator = new AjvSchemaValidator()

  constructor(opts: FileSourceOpts) {
    this.#opts = opts;
  }

  async load(schema: ObjectSchema<ObjectSpec>, loaded: Record<string, unknown>, deps?: FileSourceDeps): Promise<Record<string, unknown>> {
    const fs = deps?.fs ?? regularFs
    const file = await fs.readFile(this.#opts.file, "utf-8")

    const [ parsed, error ] = inlineCatchSync(() => JSON.parse(file) as unknown)

    if (error !== undefined) {
      throw new FileParsingError(this.#opts.file, 'JSON', { cause: error })
    }

    this.#validator.validate(schema.schema, parsed, `file ${this.#opts.file}`)

    return parsed as Record<string, unknown>
  }
}

export function fileSource(opts: FileSourceOpts): Source<"file", FileSourceDeps> {
  return new FileSource(opts)
}