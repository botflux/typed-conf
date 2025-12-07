import {ref, type RefSchema} from "../../schemes/ref.js";
import {any} from "../../schemes/any.js";
import type {BaseSchema} from "../../schemes/base.js";

export type EncodingToSchemaType<Encoding extends (BufferEncoding | undefined)> = Encoding extends BufferEncoding ? string : Buffer

export type FileOptsToSchemaType<Encoding extends BufferEncoding | undefined, ParseAs extends BaseSchema<unknown> | undefined> = Encoding extends BufferEncoding
  ? ParseAs extends BaseSchema<infer U> ? U : string
  : Buffer

export type FileOpts<Encoding extends BufferEncoding | undefined, S extends BaseSchema<unknown> | undefined> = {
  encoding?: Encoding
  parseAs?: S
}

/**
 * Create a reference to another file.
 */
export function file<ParseAs extends (BaseSchema<unknown> | undefined) = undefined, Encoding extends (BufferEncoding | undefined) = undefined>(opts?: Encoding | FileOpts<Encoding, ParseAs>): RefSchema<FileOptsToSchemaType<Encoding, ParseAs>> {
  const encoding = typeof opts === "object"
    ? opts.encoding
    : opts

  const parseAs = typeof opts === "object"
    ? opts.parseAs
    : undefined

  // @ts-expect-error
  return ref({
    schema: parseAs !== undefined ? parseAs : any<EncodingToSchemaType<Encoding>>(),
    sourceName: 'file',
    refToSourceParams: (path: string) => ({
      file: path,
      encoding,
      parse: parseAs !== undefined
    })
  })
}