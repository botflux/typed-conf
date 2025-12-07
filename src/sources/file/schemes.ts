import {ref, type RefSchema} from "../../schemes/ref.js";
import {string} from "../../schemes/string.js";
import {any} from "../../schemes/any.js";

export type EncodingToSchemaType<Encoding extends (BufferEncoding | undefined)> = Encoding extends BufferEncoding ? string : Buffer

/**
 * Create a reference to another file.
 */
export function file<Encoding extends (BufferEncoding | undefined) = undefined>(encoding?: Encoding): RefSchema<EncodingToSchemaType<Encoding>> {
  return ref({
    schema: any<EncodingToSchemaType<Encoding>>(),
    sourceName: 'file',
    refToSourceParams: (path: string) => ({file: path, encoding})
  })
}