import type {FileSystem} from "../../file-system/file-system.js";

export type ParserFn = (content: string) => unknown

export type FileOpts = {
  file: string
  required?: boolean
}

export type FileSourceOpts<Name extends string> = {
  name?: Name
  parsers?: Map<string, ParserFn>
}

export type InjectOpts = {
  fs?: FileSystem
}

export type SingleValueParams = {
  encoding?: BufferEncoding
  file: string
  parse?: boolean
}

export type LoadParams = {
  files?: (string | FileOpts)[]
}