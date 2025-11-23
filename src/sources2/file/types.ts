import type {FileSystem} from "../../sources/files/file-system.js";

export type ParserFn = (content: string) => unknown

export type FileOpts = {
  file: string
  required?: boolean
}

export type FileSourceOpts<Name extends string> = {
  name?: Name
  files: (string | FileOpts)[],
  parsers?: Map<string, ParserFn>
}

export type InjectOpts = {
  fs?: FileSystem
}

export type Params = {
  encoding?: BufferEncoding
  file: string
  parse?: boolean
}