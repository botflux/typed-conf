import {type FileHandle, readFile} from "node:fs/promises"
import  {type ObjectEncodingOptions, type OpenMode, type PathLike} from "node:fs";
import type {Abortable} from "node:events";
import type {Source, ConfigWithMetadata, SourceValue} from "./source.js";
import type {ObjectSchema, ObjectSpec} from "../schemes.js";
import * as fs from "node:fs";

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

  constructor(opts: FileSourceOpts) {
    this.#opts = opts;
  }

  async load(schema: ObjectSchema<ObjectSpec>, loaded: ConfigWithMetadata, deps?: FileSourceDeps): Promise<ConfigWithMetadata> {
    const fs = deps?.fs ?? regularFs
    const file = await fs.readFile(this.#opts.file, "utf-8")
    const parsed = JSON.parse(file)

    return this.#wrapWithMetadata(parsed, this.#opts.file)
  }

  #wrapWithMetadata(obj: any, filePath: string, keyPath: string[] = []): ConfigWithMetadata {
    if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
      const sourceValue: SourceValue = {
        value: obj,
        source: "file",
        originalNameInSource: keyPath.length > 0 ? keyPath.join(".") : "<root>"
      }
      return sourceValue as any
    }

    const result: ConfigWithMetadata = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = this.#wrapWithMetadata(value, filePath, [...keyPath, key])
    }
    return result
  }
}

export function fileSource(opts: FileSourceOpts): Source<"file", FileSourceDeps> {
  return new FileSource(opts)
}