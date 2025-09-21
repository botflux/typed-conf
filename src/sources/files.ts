import {type FileHandle, readFile} from "node:fs/promises"
import  {type ObjectEncodingOptions, type OpenMode, type PathLike} from "node:fs";
import type {Abortable} from "node:events";
import type {Source} from "./source.js";
import * as fs from "node:fs";
import type {ObjectSchema, ObjectSpec} from "../schemes/object.js";
import {AjvSchemaValidator} from "../validation/ajv.js";

export interface FileSystem {
  readFile: typeof readFile
}

type ReadFileOpts =
  | ({ encoding?: null | undefined; flag?: OpenMode | undefined } & Abortable)
  | (
  | ({ encoding: BufferEncoding; flag?: OpenMode | undefined } & Abortable)
  | BufferEncoding
  )
  | (
  | (ObjectEncodingOptions & Abortable & { flag?: OpenMode | undefined })
  | BufferEncoding
  | null
  );

export class FakeFileSystem implements FileSystem {
  #files = new Map<string, string>()

  addFile(path: string, content: string): this {
    this.#files.set(path, content)
    return this
  }

  readFile(
    path: PathLike | FileHandle,
    options?:
      | ({
      encoding?: null | undefined;
      flag?: OpenMode | undefined;
    } & Abortable)
      | null,
  ): Promise<Buffer>;
  readFile(
    path: PathLike | FileHandle,
    options:
      | ({ encoding: BufferEncoding; flag?: OpenMode | undefined } & Abortable)
      | BufferEncoding,
  ): Promise<string>;
  readFile(
    path: PathLike | FileHandle,
    options?:
      | (ObjectEncodingOptions & Abortable & { flag?: OpenMode | undefined })
      | BufferEncoding
      | null,
  ): Promise<string | Buffer>;
  async readFile(
    path: PathLike | FileHandle,
    options?: ReadFileOpts,
  ): Promise<string | Buffer> {
    if (typeof path !== "string") {
      throw new Error("Not implemented at line 25 in fake-file-system.ts");
    }

    const mFile = this.#files.get(path);

    if (mFile === undefined) {
      throw new FakeENOENTError(path);
    }

    return mFile;
  }
}

class FakeENOENTError extends Error {
  code = "ENOENT";

  constructor(path: string) {
    super(`ENOENT: no such file or directory, open '${path}'`);
  }
}

export const regularFs = { readFile }

export type FileSourceOpts = {
  file: string
}

export type FileSourceDeps = {
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

    const parsed = JSON.parse(file)

    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("Not implemented at line 106 in files.ts")
    }

    this.#validator.validate(schema.schema, parsed, `file ${this.#opts.file}`)

    return parsed
  }
}

export function fileSource(opts: FileSourceOpts): Source<"file", FileSourceDeps> {
  return new FileSource(opts)
}