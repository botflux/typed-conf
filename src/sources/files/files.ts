import type {BaseDeps, Source} from "../source.js";
import type {ObjectSchema, ObjectSpec} from "../../schemes/object.js";
import {AjvSchemaValidator} from "../../validation/ajv.js";
import {inlineCatchSync} from "../../utils.js";
import {FileParsingError} from "./file-parsing.error.js";
import {type FileSystem, regularFs} from "./file-system.js";
import {ref} from "../../schemes/ref.js";
import {string} from "../../schemes/string.js";
import type {EvaluatorFunction} from "../../indirection/default-evaluator.js";

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
  
  getEvaluatorFunction(loaded: Record<string, unknown>, deps: FileSourceDeps): EvaluatorFunction {
    return {
      name: 'file',
      params: [
        {
          name: 'path',
          type: 'string',
          required: true,
        }
      ],
      fn: async args => {
        if (!('path' in args)) {
          throw new Error("Not implemented at line 57 in files.ts")
        }
        
        if (typeof args.path !== 'string') {
          throw new Error("Not implemented at line 61 in files.ts")
        }

        const fs = deps.fs ?? regularFs
        const content = await fs.readFile(args.path, 'utf-8')

        return content
      }
    }
  }
}

export function file(format: string) {
  return ref(
    string(),
    'file',
    ref1 => ({})
  )
}

export function fileSource(opts: FileSourceOpts): Source<"file", FileSourceDeps> {
  return new FileSource(opts)
}