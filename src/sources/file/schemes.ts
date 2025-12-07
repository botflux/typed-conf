import {ref, type RefSchema} from "../../schemes/ref.js";
import {any} from "../../schemes/any.js";
import type {BaseSchema} from "../../schemes/base.js";

export type EncodingToSchemaType<Encoding extends (BufferEncoding | undefined)> = Encoding extends BufferEncoding ? string : Buffer

export type FileOpts<Encoding extends BufferEncoding, S extends BaseSchema<unknown>> = {
  encoding: Encoding
  parseAs: S
}

export type EnsureDefined<T> = T extends undefined ? never : T

/**
 * Create a reference to another file.
 */
export function file<ParseAs extends BaseSchema<unknown>, Encoding extends (BufferEncoding | undefined) = undefined>(opts?: Encoding | FileOpts<EnsureDefined<Encoding>, ParseAs>): RefSchema<EncodingToSchemaType<Encoding>> {
  const encoding = typeof opts === "object"
    ? opts.encoding
    : opts

  const parseAs = typeof opts === "object"
    ? opts.parseAs
    : undefined

  return ref({
    schema: any<EncodingToSchemaType<Encoding>>(),
    sourceName: 'file',
    refToSourceParams: (path: string) => ({
      file: path,
      encoding,
      ...parseAs !== undefined && { parseAs }
    })
  })
}